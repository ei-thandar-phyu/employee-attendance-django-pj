from django.urls import path
from . import views, views_admin, views_manager

urlpatterns = [
    path('csrf-token/', views.csrf_token_view, name='csrf_token'),

    path('login/', views.employee_login, name='employee_login'),
    path('logout/', views.employee_logout, name='employee_logout'),
    path('change-password/', views.change_password, name='change_password'),

    path('home/', views.get_personal_data, name='home_page'),
    
    path('clock-in/', views.clock_in, name='staff_clock_in'),
    path('clock-out/', views.clock_out, name='staff_clock_out'),
    path('attendance-data/', views.get_attendance_data, name='get_attendance_data'),
    
    path('leave-balances/', views.get_leave_balances, name='get_leave_balances'),
    path('available-leave/', views.get_available_leave, name='get_available_leave'),
    path('leave-request/submit', views.submit_leave_request, name='submit_leave_request'),
    path('leave-history/', views.get_leave_history, name='get_leave_history'),   
    path('leave-requests/<int:leave_id>/cancel/', views.cancel_leave_request, name='cancel_leave_request'),

    path('dept-attendance/', views_manager.get_department_attendance, name='get_department_attendance'),
    path('leave-approval/', views_manager.get_requested_leave, name='get_requested_leave'),
    path('leave-approval/<int:leave_id>/approve/', views_manager.approve_leave_request, name='approve_leave_request'),
    path('leave-approval/<int:leave_id>/reject/', views_manager.reject_leave_request, name='reject_leave_request'),

    path('all-dept-attendance/', views_admin.get_all_department_attendance, name='get_all_department_attendance'),
    path('all-leave-approval/', views_admin.get_all_leave_approval, name='get_all_leave_approval'),
    path('all-employees/', views_admin.get_all_employees, name='get_all_employees'),
    path('add-employee/', views_admin.add_new_employee, name='add_new_employee'),
    path('edit-employee/<int:emp_id>/', views_admin.edit_employee, name='edit_employee'),
    path('delete-employee/<int:emp_id>/', views_admin.delete_employee, name='delete_employee'),
    path('all-departments-names/', views_admin.get_all_department_names, name='get_all_department_names'),


    
]