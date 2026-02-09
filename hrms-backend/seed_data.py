import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from employees.models import Employee, Shift
from attendance.models import Attendance
from datetime import date, time

# Clear existing
Attendance.objects.all().delete()
Employee.objects.all().delete()
Shift.objects.all().delete()

# Create Shifts
s1 = Shift.objects.create(name="First Shift", start_time=time(9, 0), end_time=time(17, 0))
s2 = Shift.objects.create(name="Second Shift", start_time=time(14, 0), end_time=time(22, 0))

# Create Employees
employees = [
    {"id": "EMP01", "name": "Brett Johnson", "role": "UI Designer", "dept": "Design", "img": "https://i.pravatar.cc/150?u=brett"},
    {"id": "EMP02", "name": "Rhodes Peter", "role": "Project Manager", "dept": "Design", "img": "https://i.pravatar.cc/150?u=rhodes"},
    {"id": "EMP03", "name": "Jeff Jane", "role": "SW Lead", "dept": "Development", "img": "https://i.pravatar.cc/150?u=jeff"},
    {"id": "EMP04", "name": "Emily Butler", "role": "Data Scientist", "dept": "Data Science", "img": "https://i.pravatar.cc/150?u=emily"},
]

for e in employees:
    Employee.objects.create(
        employee_id=e["id"],
        full_name=e["name"],
        email=f"{e['id'].lower()}@example.com",
        department=e["dept"],
        role=e["role"],
        profile_image=e["img"],
        shift=s1
    )

# Create Attendance
for e in Employee.objects.all():
    Attendance.objects.create(
        employee=e,
        date=date.today(),
        status="On-time",
        check_in_time=time(9, 0),
        check_out_time=time(17, 0)
    )

print("Dummy data seeded successfully!")
