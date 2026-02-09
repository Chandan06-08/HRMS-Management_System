from rest_framework import serializers
from .models import Attendance
from employees.serializers import EmployeeSerializer

class AttendanceSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    employee_details = EmployeeSerializer(source="employee", read_only=True)

    class Meta:
        model = Attendance
        fields = "__all__"
