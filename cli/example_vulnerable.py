"""
example_vulnerable.py — Test file with known security problems.
Use this to confirm Bandit finds issues during Week 1 testing.
Run: compliance-cli scan --file cli/example_vulnerable.py
"""

import subprocess
import hashlib

# B602 — shell injection risk
def run_command(user_input):
    subprocess.call(user_input, shell=True)  # noqa

# B303 — use of MD5 (weak hash)
def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()  # noqa

# B105 — hardcoded password
SECRET = "hardcoded_password_123"  # noqa

# B101 — use of assert (can be stripped at compile time)
def check_admin(user):
    assert user == "admin", "Not admin"  # noqa
