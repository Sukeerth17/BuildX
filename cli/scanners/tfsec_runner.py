import asyncio
import json
from typing import List, Dict

async def run_tfsec(target: str) -> List[Dict]:
    """
    Run tfsec on a target.
    Returns a list of findings in our internal format.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            "tfsec", target, "--format", "json",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        raw = stdout.decode().strip()
        if not raw:
            return []

        data = json.loads(raw)
    except FileNotFoundError:
        print("[tfsec_runner] ERROR: tfsec is not installed. Skipping.")
        return []
    except json.JSONDecodeError:
        print(f"[tfsec_runner] ERROR: Could not parse tfsec output:\n{raw}")
        return []

    findings = []
    for issue in data.get("results", []):
        if issue.get("status") == "passed":
            continue
            
        findings.append({
            "rule_id": issue.get("rule_id", "UNKNOWN"),
            "message": issue.get("description", ""),
            "file_path": issue.get("location", {}).get("filename", target),
            "line_number": issue.get("location", {}).get("start_line", 0),
            "severity": issue.get("severity", "LOW").upper(),
            "fix_suggestion": "",
            "framework": "",
            "scanner": "tfsec",
        })

    return findings
