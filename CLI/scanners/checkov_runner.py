import asyncio
import json
from typing import List, Dict

async def run_checkov(target: str) -> List[Dict]:
    """
    Run checkov on a target.
    Returns a list of findings in our internal format.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            "checkov", "-f", target, "-o", "json", "--quiet",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        raw = stdout.decode().strip()
        if not raw:
            return []
            
        # checkov might output multiple json objects if multiple frameworks
        # we try to parse it, sometimes it's a dict, sometimes a list
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Handle checkov multiple outputs issue
            raw = "[" + raw.replace("}\n{", "},{") + "]"
            data = json.loads(raw)
            
    except FileNotFoundError:
        print("[checkov_runner] ERROR: checkov is not installed. Skipping.")
        return []
    except json.JSONDecodeError:
        print(f"[checkov_runner] ERROR: Could not parse checkov output:\n{raw}")
        return []

    findings = []
    
    if isinstance(data, dict):
        data = [data]
        
    for report in data:
        for issue in report.get("results", {}).get("failed_checks", []):
            findings.append({
                "rule_id": issue.get("check_id", "UNKNOWN"),
                "message": issue.get("check_name", ""),
                "file_path": issue.get("file_path", target).lstrip("/"),
                "line_number": issue.get("file_line_range", [0])[0],
                "severity": "HIGH", # checkov doesn't always provide severity, default to HIGH
                "fix_suggestion": "",
                "framework": "",
                "scanner": "checkov",
            })

    return findings
