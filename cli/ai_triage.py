import aiohttp
import asyncio
import json

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


async def enrich_finding(finding: dict, session: aiohttp.ClientSession) -> dict:
    """Enrich a single finding using Ollama."""
    prompt = f"""
    Is this a real security problem? What framework does it violate? How do I fix it?
    
    Tool: {finding['scanner']}
    Rule: {finding['rule_id']}
    Message: {finding['message']}
    Severity: {finding['severity']}
    
    Return a JSON response strictly with keys:
    "is_real_problem": boolean,
    "framework": string,
    "fix_suggestion": string
    """
    
    try:
        async with session.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "system": MASTER_SYSTEM_PROMPT,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=aiohttp.ClientTimeout(total=5)
        ) as response:
            if response.status == 200:
                result = await response.json()
                ai_data = json.loads(result.get("response", "{}"))
                finding["framework"] = ai_data.get("framework", "")
                finding["fix_suggestion"] = ai_data.get("fix_suggestion", "")
                finding["ai_triage_real_problem"] = ai_data.get("is_real_problem", True)
    except (aiohttp.ClientError, asyncio.TimeoutError, json.JSONDecodeError):
        # Graceful degradation: If Ollama offline, or times out, or returns bad JSON
        pass
        
    return finding

async def run_ai_triage(findings: list) -> list:
    """Run AI triage on all findings concurrently."""
    if not findings:
        return findings

    async with aiohttp.ClientSession() as session:
        tasks = [enrich_finding(f, session) for f in findings]
        enriched_findings = await asyncio.gather(*tasks)
        
    # We might want to filter out false positives here if ai_triage_real_problem is False
    # But for now, we'll just return them all and let the SARIF output include them, or filter them.
    # The prompt says: "Parse Ollama's response and add the explanation and fix to each finding"
    return enriched_findings
