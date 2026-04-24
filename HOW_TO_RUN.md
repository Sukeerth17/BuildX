# How to Run ComplianceAI

This document contains all the manual commands you need to start the different parts of the ComplianceAI project. You will need to open **separate terminal windows** for the backend and the frontend since they both run continuously.

---

## 1. Start the Backend API (FastAPI)

The backend handles the database, AI integration, and the API endpoints.

**Commands:**
```powershell
cd dashboard/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Wait until you see `Application startup complete`.*
**Access it at:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 2. Start the Frontend Dashboard (React + Vite)

The frontend is the UI where you can view findings, the dashboard, and compliance frameworks. Open a **new, separate terminal** to run this.

**Commands:**
```powershell
cd dashboard/frontend
npm run dev
```
*(If you get a script execution error on Windows, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

**Access it at:** [http://localhost:5173](http://localhost:5173)
**Login Credentials:** 
- Username: `admin`
- Password: `compliance2026`

---

## 3. Run the CLI Scanner

To run a security scan from the terminal and send the results to your running dashboard, open a **new terminal** in the root `BuildX` folder.

**Commands:**
```powershell
# Step 1: Grab an auth token from the backend
$env:COMPLIANCE_TOKEN = (python -c "import requests; print(requests.post('http://localhost:8000/api/v1/auth/login', json={'username':'admin','password':'compliance2026'}).json()['access_token'])")

# Step 2: Run the actual scan on a target file (e.g., example_vulnerable.py)
python cli/main.py scan --file cli/example_vulnerable.py --format text --ci
```

---

## 4. Run the VS Code Extension

To test the VS Code extension that highlights security issues directly in your code editor:

1. Open this `BuildX` folder in VS Code.
2. Go to the **Run and Debug** menu on the left sidebar (or press `Ctrl+Shift+D`).
3. Select **"Run Extension"** from the dropdown at the top.
4. Press the **Play** button (or press `F5`).
5. A new "Extension Development Host" VS Code window will open.
6. In that new window, open any file (like `cli/example_vulnerable.py`).
7. Open the Command Palette (`Ctrl+Shift+P`), type **`ComplianceAI: Run Scan`**, and hit Enter.
