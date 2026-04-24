# ComplianceAI Dashboard

The complete dashboard for the DevOps Compliance Checker. Includes a FastAPI backend and a React + Vite frontend.

## Prerequisites
- Python 3.11
- Node.js 20+
- Docker (for PostgreSQL and Redis)

## Start infrastructure
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=complianceai postgres:15
docker run -d -p 6379:6379 redis:7
```

## Start Ollama
```bash
ollama serve
ollama pull llama3.1:8b
```

## Start backend
```bash
cd dashboard/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

## Start frontend
```bash
cd dashboard/frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

## Login credentials
- Username: `admin`
- Password: `compliance2026`
