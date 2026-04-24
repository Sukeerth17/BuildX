# Start the Backend
Write-Host "Starting Backend API on Port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd dashboard/backend; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# Wait a couple seconds to give the backend a head start
Start-Sleep -Seconds 3

# Start the Frontend
Write-Host "Starting Frontend Dashboard on Port 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; cd dashboard/frontend; npm run dev"

Write-Host "All servers are starting up!" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor Yellow
