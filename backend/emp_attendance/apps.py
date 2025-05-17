from django.apps import AppConfig


class EmpAttendanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'emp_attendance'

    def ready(self):
        import emp_attendance.signals
