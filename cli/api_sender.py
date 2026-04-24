"""
api_sender.py — Sends SARIF findings to the dashboard backend.
Person 1 owns this. Sends a POST to the dashboard API after each scan.
"""

import requests
import json
import subprocess
import os


def send_sarif_to_dashboard(sarif_data_str: str):
    """
    Sends the SARIF findings to the dashboard backend.
    POST http://localhost:8000/api/v1/findings
    Body: SARIF JSON + commit_sha
    Headers: Authorization: Bearer <token>
    """
    url = "http://localhost:8000/api/v1/findings"
    token = os.environ.get("COMPLIANCE_TOKEN", "")
    headers = {
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Get current git commit hash
    try:
        commit_sha = subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            stderr=subprocess.DEVNULL,
        ).decode("utf-8").strip()
    except Exception:
        commit_sha = "unknown"

    # Build payload
    try:
        payload = json.loads(sarif_data_str)
        payload["commit_sha"] = commit_sha
    except Exception as e:
        print(f"Warning: Failed to parse SARIF data ({e})")
        return

    # Send to backend — graceful on failure
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        response.raise_for_status()
        print(f"[api_sender] Findings sent to dashboard successfully.")
    except requests.exceptions.RequestException as e:
        print(f"Warning: Could not send findings to dashboard ({e})")
