from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
from django.contrib.auth import get_user
from datetime import time, timedelta, datetime
from django.utils import timezone
from .models import Employee, Department, AttendanceLog, ClockMethod, LeaveType, LeaveRequest, LeaveBalance

from django.contrib.auth.decorators import login_required

from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({'csrfToken': get_token(request)})

@require_POST
def employee_login(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)

            if not request.user.is_authenticated:
                return JsonResponse({'message': 'Authentication required'}, status=401)

            employee = Employee.objects.get(user=user)
            fullname = f"{user.first_name} {user.last_name}"
            role_name = employee.role.lower()
            dept = employee.department.department_name

            # if role_name == 'ceo':
            #     redirect_url = '/ceo-dashboard/'
            # elif role_name == 'manager':
            #     redirect_url = '/manager-dashboard/'
            # elif role_name == 'hr':
            #     redirect_url = '/hr-dashboard/'
            # elif role_name == 'staff':
            #     redirect_url = '/staff-dashboard/'
            # else:
            #     return JsonResponse({'error': 'Unknown role'}, status=400)
            
            return JsonResponse({
                'message': 'Login successful',
                'fullname': fullname,
                'role': role_name,
                'dept': dept,
            }, status=200)
        else:
            return JsonResponse({'detail': 'Invalid credentials'}, status=401)

    except json.JSONDecodeError:
        return JsonResponse({'detail': 'Invalid JSON'}, status=400)

def get_personal_data(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    try:
        user = get_user(request)

        now = timezone.now()
        local_time = timezone.localtime(now)
        today = local_time.date()

        employee = Employee.objects.get(user=user)

        attendance = AttendanceLog.objects.filter(user=user, log_date=today).first()

        data = {
            'clocked_in': bool(attendance and attendance.clock_in_time),
            'clocked_out': bool(attendance and attendance.clock_out_time),
            'clock_in_time':timezone.localtime(attendance.clock_in_time).strftime('%I:%M:%S %p') if attendance and attendance.clock_in_time else None,
            'clock_out_time': timezone.localtime(attendance.clock_out_time).strftime('%I:%M:%S %p') if attendance and attendance.clock_out_time else None,
        }

        return JsonResponse(data, status=200)
      
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Employee record not found'}, status=404)

    except Exception as e:
        print("Unexpected error:", e)
        return JsonResponse({'error': 'Internal server error'}, status=500) 

def clock_in(request):
    now = timezone.now()
    local_time = timezone.localtime(now)
    today = local_time.date()

    user = get_user(request)

    attendance = AttendanceLog.objects.filter(user=user, log_date=today).first()
    if attendance:
        attendance.log_date=today
        attendance.clock_in_time = now
        attendance.clock_in_method = ClockMethod.objects.get(name='Web')
        attendance.save()
    if not attendance:
        # Company official start time (8:00 AM)
        company_start_time = timezone.datetime.combine(
            today, 
            time(8, 0, 0)  # 8:00 AM
        ).replace(tzinfo=timezone.get_current_timezone())
        
        # Check if current time is after 8:00 AM (with optional grace period)
        grace_period = timedelta(minutes=15)  # 15 minutes grace period
        is_late = now > company_start_time + grace_period
        
        # Get or create the appropriate status
        status_code = 'LATE' if is_late else 'ON_TIME'
        new_attendance = AttendanceLog(
            user=user,
            log_date=today,
            clock_in_time=now,
            clock_in_method= ClockMethod.objects.get(name='Web'),
            status=status_code
        )
        new_attendance.save()

    return JsonResponse({
    'clocked_in': True,
    'clock_in_time': local_time.strftime('%I:%M:%S %p'),
    })

def clock_out(request):
    now = timezone.now()
    local_time = timezone.localtime(now)
    today = local_time.date()
    
    user = get_user(request)

    attendance = AttendanceLog.objects.filter(user=user, log_date=today).first()
    if attendance:
        attendance.clock_out_time = now
        attendance.clock_out_method = ClockMethod.objects.get(name='Web')
        attendance.save()

    return JsonResponse({
    'clocked_out': True,
    'clock_out_time': local_time.strftime('%I:%M:%S %p'),
    })

def get_attendance_data(request):
    user = get_user(request)
    logs = AttendanceLog.objects.filter(user=user)
    data = {}

    for log in logs:
        date_str = log.log_date.strftime('%Y-%m-%d')

        if log.status == 'ON_TIME':
            data[date_str] = 'on_time'
        elif log.status == 'LATE':
            data[date_str] = 'late'
        elif log.status == 'ABSENT':
            data[date_str] = 'absent'
        else:
            data[date_str] = 'leave'

    return JsonResponse(data)

def get_leave_balances(request):
    user = get_user(request)
    
    leave_types = LeaveType.objects.all()
    balances = []

    for leave_type in leave_types:
        try:
            leave_balance = LeaveBalance.objects.get(user=user, leave_type=leave_type)
            used_days = leave_balance.used_days
        except LeaveBalance.DoesNotExist:
            used_days = 0
            
        balances.append({
            'name': leave_type.name,
            'total_days': leave_type.total_days,
            'used_days': used_days,
        })

    return JsonResponse({'leave_balances': balances})

def get_available_leave(request):
    user = get_user(request)

    leave_types = LeaveType.objects.all()
    available_leave = []

    for leave_type in leave_types:
        try:
            leave_balance = LeaveBalance.objects.get(user=user, leave_type=leave_type)
            if leave_balance.remaining_days > 0:
                available_leave.append({
                    'id': leave_type.id,
                    'name': leave_type.name
                })
        except LeaveBalance.DoesNotExist:
            available_leave.append({
                'id': leave_type.id,
                'name': leave_type.name
            })

    return JsonResponse({'leave_types': available_leave})

@require_POST
def submit_leave_request(request):
    data = json.loads(request.body)
    user = get_user(request)

    try:
        user = user
        start_date_str = data.get('start_date')
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date_str = data.get('end_date')
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        leave_type_name = data.get('leave_type')
        leave_type = LeaveType.objects.get(name=leave_type_name)
        leave_duration = data.get('leave_duration')
        reason = data.get('reason', '')
        
        try:
            leave_balance = LeaveBalance.objects.get(user=user, leave_type=leave_type)
            available_days = leave_balance.remaining_days          
        except LeaveBalance.DoesNotExist:
            available_days = leave_type.total_days
        
        delta = (end_date - start_date).days + 1
        if leave_duration in ['AM_LEAVE', 'AM_LEAVE']:
            requested_leaves = 0.5 * delta
        else:
            requested_leaves = delta

        if requested_leaves > available_days:
            return JsonResponse(
                {
                    "error": f"Insufficient leave balance. You only have {available_days} day(s) of {leave_type.name} left.",
                },
                status=400
            )

        leave_request = LeaveRequest.objects.create(
            user=user,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            leave_duration=leave_duration,
            reason=reason,
            status = 'PENDING'
        )
        new_leave = { 
            'id': leave_request.id,
            'startDate': leave_request.start_date,
            'endDate': leave_request.end_date,
            'leaveType': leave_request.leave_type.name,
            'leaveDuration': leave_request.leave_duration,
            'reason': leave_request.reason,
            'requestedAt': leave_request.requested_at,
            'status': leave_request.status,
            'approvedAt': leave_request.app_rej_at if leave_request.app_rej_at else None,
        }
        return JsonResponse({"new_leave":new_leave, "message": "Leave request submitted successfully"}, status=201)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@require_POST
def cancel_leave_request(request, leave_id):
    user = get_user(request)
    try:
        leave_request = LeaveRequest.objects.get(user=user, id=leave_id)

        if leave_request.status in ['APPROVED', 'REJECTED']:
            return JsonResponse(
                {'message': f"Leave request cannot be cancelled as it is already {leave_request.status}."},
                status=400
            )
        else:
            leave_request.status = 'CANCELLED'
            leave_request.save()
            return JsonResponse({'message': f"Leave request has been successfully cancelled."}, status=200)

    except Exception as e:
        return JsonResponse({'message': str(e)}, status=500)
    
def get_leave_history(request):
    try:
        user = get_user(request)  
        current_year = datetime.now().year
        leave_history = LeaveRequest.objects.filter(
            user=user,
            start_date__year=current_year,
        ).order_by('-requested_at')

        # Serialize the queryset into a list of dictionaries
        leave_history_data = []
        for leave in leave_history:
            leave_history_data.append({
                'id': leave.id,
                'startDate': leave.start_date,
                'endDate': leave.end_date,
                'leaveType': leave.leave_type.name,
                'leaveDuration': leave.leave_duration,
                'reason': leave.reason,
                'requestedAt': leave.requested_at,
                'status': leave.status,
                'approvedAt': leave.app_rej_at if leave.app_rej_at else None,
            })

        return JsonResponse({'leave_history': leave_history_data})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
def change_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({'message': 'Authentication required'}, status=401)
    
    user = request.user
    data = json.loads(request.body)

    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not user.check_password(current_password):
        return JsonResponse({'message': 'Incorrect current password'}, status=400)

    if current_password == new_password:
        return JsonResponse({'message': 'New password must be different'}, status=400)

    user.set_password(new_password)
    user.save()

    return JsonResponse({'message': 'Password changed successfully'})
