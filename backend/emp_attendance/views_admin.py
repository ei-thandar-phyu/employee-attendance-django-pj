from django.http import JsonResponse
from django.contrib.auth import get_user
from django.utils import timezone
from datetime import date
from .models import Department, Employee, AttendanceLog
from django.db.models import Count, Q

def get_department_info(request):
    if request.method == 'GET':
        departments = Department.objects.all()
        department_names = [department.department_name for department in departments]
        return JsonResponse({'department_names': department_names})
    return JsonResponse({'error': 'Invalid request method'}, status=400)

def get_department_attendance(request):
    department_name = request.GET.get('department')
    selected_date_str = request.GET.get('date')

    try:
        department = Department.objects.get(department_name=department_name)
        selected_date = date.fromisoformat(selected_date_str)
    except Department.DoesNotExist:
        return JsonResponse({'error': 'Department not found.'}, status=404)
    except ValueError:
        return JsonResponse({'error': 'Invalid date format. Please use YYYY-MM-DD.'}, status=400)

    employees_in_department = Employee.objects.filter(department=department, user__is_active=True)
    
    total_employees = employees_in_department.count()

    attendance_logs = AttendanceLog.objects.filter(
        user__employee__in=employees_in_department,
        log_date=selected_date
    )

    attendance_summary = attendance_logs.aggregate(
        on_time=Count('id', filter=Q(status='ON_TIME')),
        late=Count('id', filter=Q(status='LATE')),
        absent=Count('id', filter=Q(status='ABSENT')),
        full_leave=Count('id', filter=Q(status='FULL_LEAVE')),
        am_leave=Count('id', filter=Q(status='AM_LEAVE')),
        pm_leave=Count('id', filter=Q(status='PM_LEAVE')),
    )

    attendance_data = []
    for log in attendance_logs:
        employee = log.user.employee
        attendance_data.append({
            'id': employee.id,
            'name': employee.user.username,
            'clock_in_time': timezone.localtime(log.clock_in_time).strftime('%I:%M:%S %p') if log.clock_in_time else None,
            'clock_out_time': timezone.localtime(log.clock_out_time).strftime('%I:%M:%S %p') if log.clock_out_time else None,
            'clock_in_method': log.clock_in_method.name if log.clock_in_method else None,
            'clock_out_method': log.clock_out_method.name if log.clock_out_method else None,
            'status': log.status,
        })

    return JsonResponse({
        'department_name': department.department_name,
        'date': selected_date.isoformat(),
        'total_employees': total_employees,
        'attendance_summary': attendance_summary,
        'attendance_logs': attendance_data,
    })