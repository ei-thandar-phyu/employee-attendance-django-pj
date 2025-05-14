from django.urls import path
from . import views, views_admin

urlpatterns = [
    path('csrf-token/', views.csrf_token_view, name='csrf_token'),

    path('login/', views.employee_login, name='employee_login'),
    path('change-password/', views.change_password, name='change_password'),

    path('home/', views.get_personal_data, name='home_page'),
    
    path('clock-in/', views.clock_in, name='staff_clock_in'),
    path('clock-out/', views.clock_out, name='staff_clock_out'),
    path('attendance-data/', views.get_attendance_data, name='get_attendance_data'),
    
    path('leave-balances/', views.get_leave_balances, name='get_leave_balances'),
    path('available-leave/', views.get_available_leave, name='get_available_leave'),
    path('submit-leave-request/', views.submit_leave_request, name='submit_leave_request'),
    path('leave-history/', views.get_leave_history, name='get_leave_history'),   
    path('leave-requests/<int:leave_id>/cancel/', views.cancel_leave_request, name='cancel_leave_request'),

    path('dept-attendance/', views_admin.get_department_attendance, name='get_department_attendance'),
    path('departments-info/', views_admin.get_department_info, name='get_department_info'),

    
]