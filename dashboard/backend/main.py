from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from migrations import run_migrations, backfill_legacy_findings
from routers import auth, findings, frameworks, ai_chat, audit

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all ORM tables exist on startup for the active DATABASE_URL.
    Base.metadata.create_all(bind=engine)
    print("[startup] Running database migrations...")
    run_migrations()
    print("[startup] Running legacy data backfill...")
    backfill_legacy_findings()
    yield

app = FastAPI(title="ComplianceAI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(findings.router, prefix="/api/v1/findings", tags=["findings"])
app.include_router(frameworks.router, prefix="/api/v1/frameworks", tags=["frameworks"])
app.include_router(ai_chat.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["audit"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

from websocket_manager import manager

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
