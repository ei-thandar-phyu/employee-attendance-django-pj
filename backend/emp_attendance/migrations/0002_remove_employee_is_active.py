# Generated by Django 5.2.1 on 2025-05-13 01:37

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('emp_attendance', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='employee',
            name='is_active',
        ),
    ]
