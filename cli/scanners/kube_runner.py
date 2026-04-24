import asyncio
import json
from typing import List, Dict

async def run_kube_hunter(target: str) -> List[Dict]:
    """
    Run kube-hunter. (Note: kube-hunter usually targets clusters, 
    but we implement the interface to match).
    Returns a list of findings in our internal format.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            "kube-hunter", "--remote", target, "--report", "json",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        raw = stdout.decode().strip()
        if not raw:
            return []

        data = json.loads(raw)
    except FileNotFoundError:
        print("[kube_runner] ERROR: kube-hunter is not installed. Skipping.")
        return []
    except json.JSONDecodeError:
        print(f"[kube_runner] ERROR: Could not parse kube-hunter output")
        return []

    findings = []
    for issue in data.get("vulnerabilities", []):
        findings.append({
            "rule_id": issue.get("vulnerability", "UNKNOWN"),
            "message": issue.get("description", ""),
            "file_path": target,
            "line_number": 0,
            "severity": issue.get("severity", "LOW").upper(),
            "fix_suggestion": "",
            "framework": "",
            "scanner": "kube-hunter",
        })

    return findings
