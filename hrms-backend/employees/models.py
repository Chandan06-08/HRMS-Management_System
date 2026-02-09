from django.db import models

class Shift(models.Model):
    name = models.CharField(max_length=50) # e.g., First Shift, Second Shift
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"

class Employee(models.Model):
    employee_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    department = models.CharField(max_length=100)
    role = models.CharField(max_length=100, default="Software Engineer")
    profile_image = models.URLField(blank=True, null=True)
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.full_name
