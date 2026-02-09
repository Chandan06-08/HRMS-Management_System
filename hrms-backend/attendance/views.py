from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from .models import Attendance
from .serializers import AttendanceSerializer

class AttendanceViewSet(ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def create(self, request, *args, **kwargs):
        employee_id = request.data.get('employee')
        date = request.data.get('date')
        
        # Check if record already exists for this employee and date
        instance = Attendance.objects.filter(employee_id=employee_id, date=date).first()
        
        if instance:
            # Update existing record
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Create new record
        return super().create(request, *args, **kwargs)
