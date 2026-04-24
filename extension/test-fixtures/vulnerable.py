"""
ComplianceAI - Test Fixture: Known Vulnerable Python File
----------------------------------------------------------
Save this file to trigger the extension's auto-scan pipeline.

Expected behaviour:
  • Red squiggles appear on vulnerable lines
  • Hover shows severity badge + AI fix suggestion
  • Status bar updates to show issue count
  • Lightbulb appears → clicking applies the fix → re-scan fires on next save
"""

import subprocess
import sqlite3
import hashlib
import os

# ─── CRITICAL: Command Injection ─────────────────────────────────────────────
# B602 – subprocess call with shell=True
# Fix: use shell=False with a list of arguments
user_input = input("Enter filename: ")
subprocess.call("ls " + user_input, shell=True)           # line 20 – squiggle expected


# ─── HIGH: SQL Injection ──────────────────────────────────────────────────────
# B608 – hardcoded SQL with string formatting
def get_user(username: str):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE name = '%s'" % username   # line 28 – squiggle expected
    cursor.execute(query)
    return cursor.fetchall()


# ─── HIGH: Weak Hashing ───────────────────────────────────────────────────────
# B324 – use of weak hash function (MD5)
# Fix: use hashlib.sha256 instead
def hash_password(password: str) -> str:
    return hashlib.md5(password.encode()).hexdigest()             # line 36 – squiggle expected


# ─── MEDIUM: Hardcoded Secret ────────────────────────────────────────────────
# B105 – hardcoded password / secret
SECRET_KEY = "super-secret-key-1234"                             # line 41 – squiggle expected
JWT_SECRET = "hackathon-jwt-secret"                              # line 42 – squiggle expected


# ─── LOW: Use of assert in production code ───────────────────────────────────
# B101 – assert used for input validation
def validate_age(age: int):
    assert age > 0, "Age must be positive"                       # line 48 – squiggle expected
    return age


# ─── CLEAN: This function is fine ────────────────────────────────────────────
def safe_hash(data: str) -> str:
    """Correctly uses SHA-256."""
    return hashlib.sha256(data.encode()).hexdigest()
