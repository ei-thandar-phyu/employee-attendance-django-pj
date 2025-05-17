from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Employee  # Make sure this import path is correct

@receiver(post_save, sender=User)
def auto_assign_admin_role(sender, instance, created, **kwargs):
    """
    Automatically assigns the 'admin' role to a newly created superuser
    by setting the 'role' field in their associated Employee model.
    """
    if created and instance.is_superuser:
        try:
            employee = Employee.objects.create(user=instance, role='ADMIN')
        except Exception as e:
            # Handle the case where an Employee profile doesn't exist for the superuser.
            # You might want to create one here or log an error.
            print(f"Failed to create Employee profile: {e}")