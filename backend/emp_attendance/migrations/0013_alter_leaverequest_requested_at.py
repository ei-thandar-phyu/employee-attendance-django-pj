# Generated by Django 5.2.1 on 2025-05-16 18:19

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('emp_attendance', '0012_alter_employee_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='leaverequest',
            name='requested_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
