import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from employees.models import Employee, Shift
from attendance.models import Attendance

# Clear all data
print("Clearing Attendance...")
Attendance.objects.all().delete()

print("Clearing Employees...")
Employee.objects.all().delete()

print("Clearing Shifts...")
Shift.objects.all().delete()

print("Database cleared successfully!")
