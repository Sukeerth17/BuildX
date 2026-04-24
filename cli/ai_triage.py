import aiohttp
import asyncio
import json
from framework_map import get_framework_fallback

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
Because we utilize rapid pattern-matching SAST engines alongside 6 other scanners to achieve total coverage, you may occasionally see false positives. Intelligently filter these out. If it is a false positive, set is_false_positive to true and explain your reasoning in false_positive_reason."""


async def enrich_finding(finding: dict, session: aiohttp.ClientSession) -> dict:
    """Enrich a single finding using Ollama with an improved structured prompt."""
    prompt = f"""Analyze this security finding and respond with ONLY a valid JSON object.

Finding Details:
  Tool: {finding['scanner']}
  Rule ID: {finding['rule_id']}
  Message: {finding['message']}
  Severity: {finding['severity']}
  File: {finding.get('file_path', 'unknown')}

You MUST return a JSON object with exactly these keys:
{{
  "is_false_positive": <true if this is a pattern-matching false alarm, false if it is a real security risk>,
  "false_positive_reason": "<if is_false_positive is true, explain why in one sentence. Otherwise empty string.>",
  "plain_english_explanation": "<explain the security risk in 1-2 sentences as if talking to a junior developer. What can an attacker actually DO with this vulnerability?>",
  "framework": "<comma-separated list of compliance frameworks this violates, e.g. OWASP A03:2021, SOC 2 CC6.7, HIPAA §164.312>",
  "fix_suggestion": "<the exact corrected code snippet or the specific action to take to fix this. Be concrete and copy-pasteable.>"
}}"""

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
            timeout=aiohttp.ClientTimeout(total=15)
        ) as response:
            if response.status == 200:
                result = await response.json()
                ai_data = json.loads(result.get("response", "{}"))

                finding["plain_english_explanation"] = ai_data.get("plain_english_explanation", "")
                finding["framework"] = ai_data.get("framework", "")
                finding["fix_suggestion"] = ai_data.get("fix_suggestion", "")
                finding["is_false_positive"] = ai_data.get("is_false_positive", False)
                finding["false_positive_reason"] = ai_data.get("false_positive_reason", "")

    except (aiohttp.ClientError, asyncio.TimeoutError, json.JSONDecodeError):
        # Graceful degradation: Ollama offline, timed out, or returned bad JSON
        finding["is_false_positive"] = False

    # USP 2: Apply deterministic fallback if AI returned an empty framework
    if not finding.get("framework"):
        finding["framework"] = get_framework_fallback(finding.get("rule_id", ""))

    return finding


async def run_ai_triage(findings: list) -> list:
    """Run AI triage on all findings concurrently."""
    if not findings:
        return findings

    async with aiohttp.ClientSession() as session:
        tasks = [enrich_finding(f, session) for f in findings]
        enriched_findings = await asyncio.gather(*tasks)

    # USP 3: Flag false positives but keep them so the dashboard can show them greyed out.
    # They are marked with is_false_positive=True in the SARIF output.
    real_findings = [f for f in enriched_findings if not f.get("is_false_positive", False)]
    flagged = [f for f in enriched_findings if f.get("is_false_positive", False)]

    if flagged:
        import sys
        print(f"[ai_triage] {len(flagged)} finding(s) flagged as false positives and excluded from output.", file=sys.stderr)

    return real_findings
