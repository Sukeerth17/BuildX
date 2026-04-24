import asyncio
import json
from typing import List, Dict

async def run_trivy(target: str) -> List[Dict]:
    """
    Run Trivy on a target (file/image/dir).
    Returns a list of findings in our internal format.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            "trivy", "fs", "--format", "json", "-q", target,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        raw = stdout.decode().strip()
        if not raw:
            return []

        data = json.loads(raw)
    except FileNotFoundError:
        print("[trivy_runner] ERROR: trivy is not installed. Skipping.")
        return []
    except json.JSONDecodeError:
        print(f"[trivy_runner] ERROR: Could not parse Trivy output:\n{raw}")
        return []

    findings = []
    for result in data.get("Results", []):
        for vuln in result.get("Vulnerabilities", []):
            findings.append({
                "rule_id": vuln.get("VulnerabilityID", "UNKNOWN"),
                "message": vuln.get("Title", "") or vuln.get("Description", ""),
                "file_path": result.get("Target", target),
                "line_number": 0, # Trivy fs doesn't typically give line numbers for all
                "severity": vuln.get("Severity", "LOW"),
                "fix_suggestion": "",
                "framework": "",
                "scanner": "trivy",
            })

    return findings
