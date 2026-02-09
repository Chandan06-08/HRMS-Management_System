from rest_framework import serializers
from .models import Employee, Shift

class ShiftSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = Shift
        fields = "__all__"

class EmployeeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    shift_details = ShiftSerializer(source="shift", read_only=True)
    
    class Meta:
        model = Employee
        fields = "__all__"
