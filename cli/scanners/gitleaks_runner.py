import asyncio
import json
import os
import sys
from typing import List, Dict

async def run_gitleaks(target: str) -> List[Dict]:
    """
    Run gitleaks on a target.
    Returns a list of findings in our internal format.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            "gitleaks", "detect", "--source", target, "-v", "--report-format", "json", "--report-path", "gitleaks-report.json",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        
        if not os.path.exists("gitleaks-report.json"):
            return []

        with open("gitleaks-report.json", "r") as f:
            content = f.read().strip()
            if not content:
                data = []
            else:
                data = json.loads(content)
        
        # Clean up
        os.remove("gitleaks-report.json")

    except FileNotFoundError:
        print("[gitleaks_runner] ERROR: gitleaks is not installed. Skipping.", file=sys.stderr)
        return []
    except json.JSONDecodeError:
        print("[gitleaks_runner] ERROR: Could not parse gitleaks output", file=sys.stderr)
        return []

    findings = []
    for issue in data:
        findings.append({
            "rule_id": issue.get("RuleID", "UNKNOWN"),
            "message": f"Secret detected: {issue.get('Description', '')}",
            "file_path": issue.get("File", target),
            "line_number": issue.get("StartLine", 0),
            "severity": "CRITICAL",  # secrets are usually critical
            "fix_suggestion": "",
            "framework": "",
            "scanner": "gitleaks",
        })

    return findings
