# Run this script to start both Backend and Frontend
Write-Host "Starting HRMS Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd hrms-backend; .\venv\Scripts\python.exe manage.py runserver 8000"

Write-Host "Starting HRMS Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd hrms-frontend; npm start"

Write-Host "Both servers are starting in separate windows." -ForegroundColor Yellow
Write-Host "Backend: http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:3000"
