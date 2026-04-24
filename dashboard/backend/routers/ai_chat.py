from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import httpx
import json

from database import get_db
from models import Finding

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

OLLAMA_URL = "http://localhost:11434/api/generate"

@router.post("/chat")
async def chat_with_ai(req: ChatRequest, db: Session = Depends(get_db)):
    recent_findings = db.query(Finding).order_by(Finding.id.desc()).limit(20).all()
    
    summary_lines = []
    for f in recent_findings:
        summary_lines.append(f"[{f.severity}] {f.rule_id} in {f.repo} ({f.file_path}): {f.message}")
        
    findings_summary = "\n".join(summary_lines)
    if not findings_summary:
        findings_summary = "No recent findings."

    prompt = f"""You are a DevOps compliance expert. The user has the following recent security findings:
{findings_summary}

Additional context: {req.context or 'None'}

User question: {req.message}
Answer concisely and practically."""

    async def ollama_stream():
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", OLLAMA_URL, json={
                    "model": "llama3.1:8b",
                    "prompt": prompt,
                    "stream": True
                }, timeout=30.0) as response:
                    if response.status_code != 200:
                        yield "AI service is currently offline. Please try again later."
                        return
                    
                    async for chunk in response.aiter_lines():
                        if chunk:
                            try:
                                data = json.loads(chunk)
                                if "response" in data:
                                    yield data["response"]
                            except:
                                pass
        except Exception:
            yield "AI service is currently offline. Please try again later."

    return StreamingResponse(ollama_stream(), media_type="text/plain")
