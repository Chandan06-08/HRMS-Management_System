from rest_framework.viewsets import ModelViewSet
from .models import Employee, Shift
from .serializers import EmployeeSerializer, ShiftSerializer

class ShiftViewSet(ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer

class EmployeeViewSet(ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
