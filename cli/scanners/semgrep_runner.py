import asyncio
import json
import sys
from typing import List, Dict

async def run_semgrep(target: str) -> List[Dict]:
    """
    Run semgrep on a target.
    Returns a list of findings in our internal format.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            "semgrep", "scan", "--config=auto", "--json", "-q", target,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        raw = stdout.decode().strip()
        if not raw:
            return []

        data = json.loads(raw)
    except FileNotFoundError:
        print("[semgrep_runner] ERROR: semgrep is not installed. Skipping.", file=sys.stderr)
        return []
    except json.JSONDecodeError:
        print(f"[semgrep_runner] ERROR: Could not parse semgrep output:\n{raw}", file=sys.stderr)
        return []

    findings = []
    for issue in data.get("results", []):
        severity = issue.get("extra", {}).get("severity", "LOW")
        # Semgrep severities: INFO, WARNING, ERROR
        mapped_severity = "LOW"
        if severity == "WARNING":
            mapped_severity = "MEDIUM"
        elif severity == "ERROR":
            mapped_severity = "HIGH"

        findings.append({
            "rule_id": issue.get("check_id", "UNKNOWN"),
            "message": issue.get("extra", {}).get("message", ""),
            "file_path": issue.get("path", target),
            "line_number": issue.get("start", {}).get("line", 0),
            "severity": mapped_severity,
            "fix_suggestion": "",
            "framework": "",
            "scanner": "semgrep",
        })

    return findings
