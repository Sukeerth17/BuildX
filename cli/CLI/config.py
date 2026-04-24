"""
config.py — Reads the .compliance.yml settings file
Person 1 defines this format. Nobody else changes it.
"""

import os
import yaml

DEFAULT_CONFIG = {
    "severity_threshold": "LOW",       # minimum severity to report
    "ignored_rules": [],               # list of rule IDs to skip
    "accepted_risks_file": "cli/accepted_risks.json",  # path to accepted risks
}


def load_config(path: str = ".compliance.yml") -> dict:
    """Load config from .compliance.yml, falling back to defaults."""
    if not os.path.exists(path):
        return DEFAULT_CONFIG.copy()

    with open(path, "r") as f:
        user_config = yaml.safe_load(f) or {}

    config = DEFAULT_CONFIG.copy()
    config.update(user_config)
    return config
