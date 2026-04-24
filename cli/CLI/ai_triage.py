import aiohttp
import asyncio
import json

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
