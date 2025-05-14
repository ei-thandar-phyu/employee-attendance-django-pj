from django.http import JsonResponse
from django.contrib.auth import get_user
from django.utils import timezone
from .models import Employee, AttendanceLog
from django.contrib.auth.decorators import login_required

def staff_dashboard(request):
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

