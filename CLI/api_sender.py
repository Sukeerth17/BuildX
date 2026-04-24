import requests
import json
import subprocess
import os

def send_sarif_to_dashboard(sarif_data_str: str):
    """
    Sends the SARIF findings to the dashboard backend.
    """
    url = "http://localhost:8000/api/v1/findings"
    token = os.environ.get("COMPLIANCE_TOKEN", "default_dummy_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Get current git commit hash
    try:
        commit_sha = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], 
            stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
    except Exception:
        commit_sha = "unknown"

    # Add commit_sha to payload
    try:
        payload = json.loads(sarif_data_str)
        payload["commit_sha"] = commit_sha
    except Exception as e:
        print(f"Warning: Failed to parse SARIF data ({e})")
        return

    # Send to backend
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Warning: Failed to send findings to dashboard ({e})")
