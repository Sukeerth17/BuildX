import os
import sqlite3
import hashlib
import requests

def vulnerable_function(user_input):
    # 1. Command Injection
    os.system("echo " + user_input)

    # 2. SQL Injection
    conn = sqlite3.connect('example.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE name = '%s'" % user_input)

    # 3. Weak Cryptography (MD5)
    m = hashlib.md5()
    m.update(b"Some password")

    # 4. Hardcoded Password/Secret
    aws_secret_key = "AKIAIOSFODNN7EXAMPLE"

    # 5. Insecure HTTP request (no certificate verification)
    requests.get("https://example.com", verify=False)

vulnerable_function("test")
