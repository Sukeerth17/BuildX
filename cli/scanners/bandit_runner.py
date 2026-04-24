"""
bandit_runner.py — Runs Bandit for Python files
Part of /cli/scanners/. Person 1 owns this file.

Install: pip install bandit
"""

import asyncio
import json
import subprocess
from typing import List, Dict


async def run_bandit(file_path: str) -> List[Dict]:
    """
    Run Bandit on a Python file.
    Returns a list of findings in our internal format.
    """
    if not file_path.endswith(".py"):
        return []

    try:
        process = await asyncio.create_subprocess_exec(
            "bandit", "-f", "json", "-q", file_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        # Bandit exits with code 1 when findings exist — that's normal
        raw = stdout.decode().strip()
        if not raw:
            return []

        data = json.loads(raw)

    except FileNotFoundError:
        print("[bandit_runner] ERROR: bandit is not installed. Run: pip install bandit")
        return []
    except json.JSONDecodeError:
        print(f"[bandit_runner] ERROR: Could not parse Bandit output:\n{raw}")
        return []

    findings = []
    for issue in data.get("results", []):
        findings.append({
            "rule_id": issue.get("test_id", "UNKNOWN"),          # e.g. "B105"
            "message": issue.get("issue_text", ""),
            "file_path": issue.get("filename", file_path),
            "line_number": issue.get("line_number", 0),
            "severity": _map_severity(issue.get("issue_severity", "LOW")),
            "fix_suggestion": "",   # filled in by ai_triage.py (Week 2)
            "framework": "",        # filled in by ai_triage.py (Week 2)
            "scanner": "bandit",
        })

    return findings


def _map_severity(bandit_severity: str) -> str:
    """Map Bandit severity strings to our standard levels."""
    mapping = {
        "HIGH": "HIGH",
        "MEDIUM": "MEDIUM",
        "LOW": "LOW",
    }
    return mapping.get(bandit_severity.upper(), "LOW")
