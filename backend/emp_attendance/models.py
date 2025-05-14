from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

class Employee(models.Model):
    ROLES = [
    ('STAFF', 'Staff'),
    ('HR', 'HR'),
    ('MANAGER', 'Manager'),
    ('CEO', 'CEO')
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
	
    position = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True)
    joined_at = models.DateField(null=True, blank=True)
    role = models.CharField(max_length=10, choices=ROLES, default='STAFF')
    report_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='leave_report_to')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} ({self.user.email})"

class Department(models.Model):
    department_name = models.CharField(max_length=100)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_departments')

    def __str__(self):
        return self.department_name

class ClockMethod(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
class AttendanceLog(models.Model):
    ATTENDANCE_STATUS_CHOICES = [
    ('ON_TIME', 'On Time'),
    ('LATE', 'Late'),
    ('ABSENT', 'Absent'),
    ('FULL_LEAVE', 'Full Day Leave'),
    ('AM_LEAVE', 'AM Leave'),
    ('PM_LEAVE', 'PM Leave'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    clock_in_time = models.DateTimeField(null=True, blank=True)
    clock_out_time = models.DateTimeField(null=True, blank=True)
    clock_in_method = models.ForeignKey(ClockMethod, on_delete=models.SET_NULL, null=True, blank=True, related_name='clock_in_logs')
    clock_out_method = models.ForeignKey(ClockMethod, on_delete=models.SET_NULL, null=True, blank=True, related_name='clock_out_logs')
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS_CHOICES)
    log_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f'{self.user.email} - {self.log_date}'
    
    class Meta:
        ordering = ['-log_date']
        unique_together = ('user', 'log_date')

class LeaveType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    total_days = models.FloatField(default=0)
    is_paid = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.total_days} days)"
    
class LeaveRequest(models.Model):
    STATUS_CHOICES = [
    ('PENDING', 'Pending'),
    ('APPROVED', 'Approved'),
    ('REJECTED', 'Rejected'),
    ('CANCELLED', 'Cancelled'),
    ]
    
    LEAVE_DURATION_CHOICES = [
    ('FULL_LEAVE', 'Full Day Leave'),
    ('AM_LEAVE', 'Morning Leave'),
    ('PM_LEAVE', 'Afternoon Leave'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    #start_time = models.TimeField(null=True, blank=True)
    #end_time = models.TimeField(null=True, blank=True)
    leave_type = models.ForeignKey(LeaveType, on_delete=models.SET_NULL, null=True)
    leave_duration = models.CharField(max_length=10, choices=LEAVE_DURATION_CHOICES, default='FULL_LEAVE')
    reason = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True, null=True)
    request_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='leave_request_to')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    app_rej_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='leave_approved_rejected')
    app_rej_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.user.email} leave from {self.start_date} to {self.end_date}'
    
    def update_leave_balance(self):
        # Calculate the leave days based on duration and the leave type's total days
        if self.status == 'APPROVED':
            leave_balance, created = LeaveBalance.objects.get_or_create(user=self.user, leave_type=self.leave_type)
            total_days = (self.end_date - self.start_date).days + 1

            if self.leave_duration == 'FULL_LEAVE':
                days_to_add = total_days
            elif self.leave_duration == 'AM_LEAVE' or self.leave_duration == 'PM_LEAVE':
                # Assuming half-day leaves are 0.5 days
                days_to_add = 0.5 * total_days
            else:
                days_to_add = 0

            # Update the used_days field in LeaveBalance
            leave_balance.used_days += days_to_add
            leave_balance.save()
    
    def update_attendance_log(self):
        current_date = self.start_date
        while current_date <= self.end_date:
            leave_type = self.leave_duration
            
            try:
                attendance = AttendanceLog.objects.get(user=self.user, log_date=current_date)
                # Already clocked in — update status only (preserve times)
                attendance.status = leave_type
                attendance.save()

            except AttendanceLog.DoesNotExist:
                # No attendance yet — create a new record
                status_code = leave_type

                AttendanceLog.objects.create(
                    user=self.user,
                    log_date=current_date,
                    clock_in_time=None,
                    clock_out_time=None,
                    clock_in_method=None,
                    clock_out_method=None,
                    status=status_code
                )

            current_date += timedelta(days=1)

    def save(self, *args, **kwargs):
        if not self.request_to:
            self.request_to = self.user.employee.report_to.user
        
        if self.status in ['APPROVED','REJECTED']:
            self.app_rej_at = timezone.now()

        is_new_approval = False
        if self.pk:
            original = LeaveRequest.objects.get(pk=self.pk)
            if original.status != 'APPROVED' and self.status == 'APPROVED':
                is_new_approval = True
        elif self.status == 'APPROVED':
            is_new_approval = True

        super().save(*args, **kwargs)  # Save first to ensure pk exists

        if is_new_approval:
            self.update_leave_balance()
            self.update_attendance_log()  

class LeaveBalance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey('LeaveType', on_delete=models.SET_NULL, null=True)
    used_days = models.FloatField(default=0)

    @property
    def remaining_days(self):
        return self.leave_type.total_days - self.used_days

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - {self.leave_type.name}: {self.used_days} used"