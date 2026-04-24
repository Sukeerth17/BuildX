from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, findings, frameworks, ai_chat, audit

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ComplianceAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
