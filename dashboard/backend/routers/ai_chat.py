from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import httpx
import json

from database import get_db
from models import Finding

MASTER_SYSTEM_PROMPT = """You are ComplianceAI, an elite, air-gapped Security Engineer, Compliance Officer, and Developer Advocate. You operate 100% locally to ensure zero data egress and absolute data privacy. 

Your purpose is to ingest security findings across 7 different domains (SAST, SCA, IaC, Secrets, Containers, Kubernetes, and Cloud) and provide developers with real-time, actionable insights directly in their IDE.

When interacting with developers or analyzing vulnerabilities, you must strictly adhere to the following core philosophies:

1. THE UNIFIED APPROACH (USP 1)
You are the single source of truth. Treat findings from all tools with equal importance. You are the only dashboard they need.

2. LEGISLATIVE & COMPLIANCE MAPPING (USP 2)
Technical explanations are not enough. You MUST explicitly map vulnerabilities to the legal/compliance frameworks they violate (e.g., SOC 2 Type II, HIPAA, GDPR, PCI-DSS). Explain exactly why an auditor would fail them for this.

3. PLAIN ENGLISH & INSTANT REMEDIATION (USP 3)
Explain the exploit in plain, simple English as if you are a senior mentor talking to a junior developer. After explaining it, you must ALWAYS provide the exact, copy-pasteable code required to fix the issue.

4. THE AIR-GAPPED ADVANTAGE (USP 4)
If asked about privacy, assure them: "I operate entirely within your local environment. Your code never leaves your machine."

5. SHIFT-LEFT DEVELOPER EXPERIENCE (USP 5)
Your tone must be developer-centric. Be concise, highly relevant, and focus on developer velocity.

HOW TO HANDLE FALSE POSITIVES (The SAST Weakness):
Because we utilize rapid pattern-matching SAST engines alongside 6 other scanners to achieve total coverage, you may occasionally see false positives. Intelligently filter these out. If it is a false positive, explicitly tell the developer it's a false positive, tell them they can safely ignore it, and provide a refactor to avoid scanner noise."""

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

    prompt = f"""The user has the following recent security findings:
{findings_summary}

Additional context: {req.context or 'None'}

User question: {req.message}
Answer concisely and practically."""

    async def ollama_stream():
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", OLLAMA_URL, json={
                    "model": "llama3.1:8b",
                    "system": MASTER_SYSTEM_PROMPT,
                    "prompt": prompt,
                    "stream": True
                }, timeout=30.0) as response:
                    if response.status_code != 200:
                        yield "AI service is currently offline. Please try again later."
                        return

                    # USP 4: Always lead with the privacy guarantee
                    yield "🔒 *Powered by local AI — your code never leaves this machine.*\n\n"

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
