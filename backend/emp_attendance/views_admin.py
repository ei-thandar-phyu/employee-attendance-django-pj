from django.http import JsonResponse
import json
from django.contrib.auth import get_user
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import date, datetime
from .models import User, Department, Employee, AttendanceLog, LeaveRequest, LeaveType
from django.db.models import Count, Q, F

def get_all_department_names(request):
    if request.method == 'GET':
        departments = Department.objects.all()
        department_names = [department.department_name for department in departments]
        return JsonResponse({'department_names': department_names})
    return JsonResponse({'error': 'Invalid request method'}, status=400)

def get_all_employees(request):
    if request.method == 'GET':
                
        employees = Employee.objects.all().order_by('-created_at')
        employee_data = []
        for employee in employees:
            employee_data.append({
                'id': employee.id,
                'username': employee.user.username,
                'email': employee.user.email,
                'firstName': employee.user.first_name,
                'lastName': employee.user.last_name,
                'department': employee.department.department_name if employee.department else None,
                'position': employee.position,
                'phone': employee.phone,
                'joinedAt': employee.joined_at,
                'role': employee.role,
                'reportTo': employee.report_to.user.username if employee.report_to else None,
                'isActive': employee.user.is_active,
            })
        return JsonResponse({'employees': employee_data})
    return JsonResponse({'error': 'Invalid request method'}, status=400)

@require_POST
def add_new_employee(request):
    data = json.loads(request.body)

    username = data.get('username')
    email = data.get('email')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    password = data.get('password')
    department_name = data.get('department')
    position = data.get('position')
    phone = data.get('phone')
    role = data.get('role')
    joined_at = data.get('joinedAt')
    report_to_username= data.get('reportTo')
    is_active = data.get('isActive')

    try:
        if report_to_username == "":
            report_to_employee = None
        else:
            try:
                report_to_user = User.objects.get(username=report_to_username)
                report_to_employee = Employee.objects.get(user=report_to_user)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid report_to username'}, status=400)
        if department_name == "":
            department = None
        else:
            try:
                department = Department.objects.get(department_name=department_name)
            except Department.DoesNotExist:
                return JsonResponse({'error': 'Department not found.'}, status=404)
        
        user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=is_active,
        )

        employee = Employee.objects.create(
            user=user,
            department=department,
            position=position,
            phone=phone,
            role=role,
            joined_at=joined_at,
            report_to=report_to_employee
        )
        return JsonResponse({'message': 'Employee added successfully.'})
    except Department.DoesNotExist:
        return JsonResponse({'error': 'Department not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def edit_employee(request, emp_id):
    data = json.loads(request.body)

    username = data.get('username')
    email = data.get('email')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    department_name = data.get('department')
    position = data.get('position')
    phone = data.get('phone')
    role = data.get('role')
    joined_at = data.get('joinedAt')
    report_to_username = data.get('reportTo')
    is_active = data.get('isActive')

    try:
        employee = Employee.objects.get(id=emp_id)
        user = employee.user

        if report_to_username == "":
            report_to_employee = None
        else:
            try:
                report_to_user = User.objects.get(username=report_to_username)
                report_to_employee = Employee.objects.get(user=report_to_user)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid report_to username'}, status=400)
        if department_name == "":
            department = None
        else:
            try:
                department = Department.objects.get(department_name=department_name)
            except Department.DoesNotExist:
                return JsonResponse({'error': 'Department not found.'}, status=404)
        

        user.username = username
        user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.is_active = is_active
        user.save()

        employee.department = department
        employee.position = position
        employee.phone = phone
        employee.role = role
        employee.joined_at = joined_at
        employee.report_to= report_to_employee
        employee.save()

        return JsonResponse({'message': 'Employee updated successfully.'})
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Employee not found.'}, status=404)
    except Department.DoesNotExist:
        return JsonResponse({'error': 'Department not found.'}, status=404)
    except (User.DoesNotExist, Employee.DoesNotExist):
        return JsonResponse({'error': 'Invalid report_to username'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def delete_employee(request, emp_id):
    try:
        employee = Employee.objects.get(id=emp_id)
        user = employee.user
        employee.delete()
        user.delete()
        return JsonResponse({'message': 'Employee deleted successfully.'})
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Employee not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_all_department_attendance(request):

    selected_date_str = request.GET.get('date')

    try:
        selected_date = date.fromisoformat(selected_date_str)
    except ValueError:
        return JsonResponse({'error': 'Invalid date format. Please use YYYY-MM-DD.'}, status=400)
    
    attendance_logs = AttendanceLog.objects.filter(
        log_date=selected_date
    )

    # Get total active employees per department
    department_employee_counts = (
        Employee.objects.filter(user__is_active=True)
        .values(department_name=F('department__department_name'))
        .annotate(total_employees=Count('id'))
    )

    # Map department names to their employee counts
    employee_count_map = {
        item['department_name']: item['total_employees']
        for item in department_employee_counts
    }

    # Attendance summary per department
    attendance_summary = (
        AttendanceLog.objects
        .filter(log_date=selected_date)
        .values(department_name=F('user__employee__department__department_name'))
        .annotate(
            on_time=Count('id', filter=Q(status='ON_TIME')),
            late=Count('id', filter=Q(status='LATE')),
            absent=Count('id', filter=Q(status='ABSENT')),
            full_leave=Count('id', filter=Q(status='FULL_LEAVE')),
            am_leave=Count('id', filter=Q(status='AM_LEAVE')),
            pm_leave=Count('id', filter=Q(status='PM_LEAVE')),
        )
        .order_by('department_name')
    )

    # Add total_employees to each summary record
    for record in attendance_summary:
        record['total_employees'] = employee_count_map.get(record['department_name'], 0)


    attendance_data = []
    for log in attendance_logs:
        employee = log.user.employee
        
        attendance_data.append({
            'id': employee.id,
            'name': employee.user.username,
            'department': employee.department.department_name if employee.department else None,
            'clock_in_time': timezone.localtime(log.clock_in_time).strftime('%I:%M:%S %p') if log.clock_in_time else None,
            'clock_out_time': timezone.localtime(log.clock_out_time).strftime('%I:%M:%S %p') if log.clock_out_time else None,
            'clock_in_method': log.clock_in_method.name if log.clock_in_method else None,
            'clock_out_method': log.clock_out_method.name if log.clock_out_method else None,
            'status': log.status,
        })

    return JsonResponse({
        'date': selected_date.isoformat(),
        'attendance_summary': list(attendance_summary),
        'attendance_logs': attendance_data,
    })
 
def get_all_leave_approval(request):
    user = get_user(request)
    try:
        current_year = datetime.now().year
        leave_requests = LeaveRequest.objects.filter(requested_at__year=current_year).order_by('-requested_at')

        leave_data = []
        for leave in leave_requests:
            dept = ''
            if leave.user.employee.department is not None:
                 dept = leave.user.employee.department.department_name,
            leave_data.append({
                'id': leave.id,
                'requestedAt': leave.requested_at,
                'name': leave.user.username,
                'department': dept,
                'startDate': leave.start_date,
                'endDate': leave.end_date,
                'leaveType': leave.leave_type.name,
                'duration': leave.leave_duration,
                'reason': leave.reason,
                'status': leave.status,
                'requestedTo': leave.request_to.get_full_name() if leave.request_to else '---',
                'apprejBy': leave.app_rej_by.get_full_name() if leave.app_rej_by else '---',
                'apprejAt': leave.app_rej_at if leave.app_rej_at else '---',
            })
        return JsonResponse({'leave_requests': leave_data})
    except Exception as e:
        return JsonResponse({'error': 'Error fetching leave requests.'}, status=500)

    user = get_user(request)
    try:
        current_year = datetime.now().year
        leave_requests = LeaveRequest.objects.filter(request_to=user, requested_at__year=current_year).order_by('-requested_at')

        leave_data = []
        for leave in leave_requests:
            leave_data.append({
                'id': leave.id,
                'requestedAt': leave.requested_at,
                'name': leave.user.username,
                'department': leave.user.employee.department.department_name,
                'startDate': leave.start_date,
                'endDate': leave.end_date,
                'leaveType': leave.leave_type.name,
                'duration': leave.leave_duration,
                'reason': leave.reason,
                'status': leave.status,
            })
        return JsonResponse({'leave_requests': leave_data})
    except Exception as e:
        return JsonResponse({'error': 'Error fetching leave requests.'}, status=500)

    user = get_user(request)
    try:
        leave_request = LeaveRequest.objects.get(id=leave_id)
    except LeaveRequest.DoesNotExist:
        return JsonResponse({'error': 'Leave request not found.'}, status=404)

    if request.method == 'POST':
        leave_request.status = 'REJECTED'
        leave_request.app_rej_by = user
        leave_request.app_rej_at = timezone.now()
        leave_request.save()
        return JsonResponse({'message': 'Leave request rejected successfully.'})
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)