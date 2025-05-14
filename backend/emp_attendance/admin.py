from django.contrib import admin
from .models import Employee, Department, ClockMethod, AttendanceLog, LeaveType, LeaveRequest, LeaveBalance

admin.site.register(Employee)
admin.site.register(Department)
admin.site.register(ClockMethod)
admin.site.register(AttendanceLog)
admin.site.register(LeaveType)
admin.site.register(LeaveRequest)
admin.site.register(LeaveBalance)
