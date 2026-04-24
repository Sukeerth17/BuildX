"""
framework_map.py — Deterministic fallback mapping from rule IDs to compliance frameworks.

USP 2: If Ollama is offline or returns an empty framework, this map guarantees
every known finding still gets a compliance framework attached to it.
"""

FRAMEWORK_MAP: dict = {
    # Bandit rules
    "B101": ["OWASP A05:2021", "CWE-617"],
    "B102": ["OWASP A03:2021", "CWE-78"],
    "B105": ["OWASP A07:2021", "CWE-259", "PCI-DSS 6.2.4"],
    "B106": ["OWASP A07:2021", "CWE-259", "PCI-DSS 6.2.4"],
    "B107": ["OWASP A07:2021", "CWE-259"],
    "B108": ["CWE-377", "OWASP A01:2021"],
    "B110": ["OWASP A09:2021", "CWE-390"],
    "B112": ["OWASP A09:2021", "CWE-391"],
    "B201": ["OWASP A05:2021", "CWE-94"],
    "B301": ["OWASP A08:2021", "CWE-502"],
    "B302": ["OWASP A08:2021", "CWE-502"],
    "B303": ["OWASP A02:2021", "CWE-327", "PCI-DSS 6.2.4"],
    "B304": ["OWASP A02:2021", "CWE-327"],
    "B305": ["OWASP A02:2021", "CWE-327"],
    "B306": ["CWE-377"],
    "B307": ["OWASP A03:2021", "CWE-78"],
    "B308": ["OWASP A03:2021", "CWE-78"],
    "B310": ["OWASP A10:2021", "CWE-918"],
    "B311": ["OWASP A02:2021", "CWE-338"],
    "B312": ["OWASP A10:2021", "CWE-400"],
    "B313": ["OWASP A03:2021", "CWE-611"],
    "B314": ["OWASP A03:2021", "CWE-611"],
    "B315": ["OWASP A03:2021", "CWE-611"],
    "B316": ["OWASP A03:2021", "CWE-611"],
    "B317": ["OWASP A03:2021", "CWE-611"],
    "B318": ["OWASP A03:2021", "CWE-611"],
    "B319": ["OWASP A03:2021", "CWE-611"],
    "B320": ["OWASP A03:2021", "CWE-611"],
    "B321": ["OWASP A02:2021", "CWE-319"],
    "B322": ["OWASP A03:2021", "CWE-78"],
    "B323": ["OWASP A02:2021", "CWE-295"],
    "B324": ["OWASP A02:2021", "CWE-327", "PCI-DSS 6.2.4", "HIPAA §164.312(a)(2)(iv)"],
    "B325": ["OWASP A02:2021", "CWE-327"],
    "B401": ["OWASP A06:2021", "CWE-477"],
    "B402": ["OWASP A06:2021", "CWE-477"],
    "B403": ["OWASP A03:2021", "CWE-78"],
    "B404": ["OWASP A03:2021", "CWE-78"],
    "B405": ["OWASP A06:2021", "CWE-477"],
    "B406": ["OWASP A06:2021", "CWE-477"],
    "B407": ["OWASP A06:2021", "CWE-477"],
    "B408": ["OWASP A06:2021", "CWE-477"],
    "B409": ["OWASP A06:2021", "CWE-477"],
    "B410": ["OWASP A06:2021", "CWE-477"],
    "B411": ["OWASP A03:2021", "CWE-611"],
    "B412": ["OWASP A01:2021", "CWE-306"],
    "B413": ["OWASP A02:2021", "CWE-327"],
    "B501": ["OWASP A02:2021", "CWE-295", "PCI-DSS 6.5.4"],
    "B502": ["OWASP A02:2021", "CWE-295"],
    "B503": ["OWASP A02:2021", "CWE-295"],
    "B504": ["OWASP A02:2021", "CWE-295"],
    "B505": ["OWASP A02:2021", "CWE-326", "NIST SP 800-131A"],
    "B506": ["OWASP A05:2021", "CWE-1188"],
    "B507": ["OWASP A02:2021", "CWE-295"],
    "B601": ["OWASP A03:2021", "CWE-78"],
    "B602": ["OWASP A03:2021", "CWE-78", "HIPAA §164.312", "SOC 2 CC6.7"],
    "B603": ["OWASP A03:2021", "CWE-78"],
    "B604": ["OWASP A03:2021", "CWE-78"],
    "B605": ["OWASP A03:2021", "CWE-78"],
    "B606": ["OWASP A03:2021", "CWE-78"],
    "B607": ["OWASP A03:2021", "CWE-78"],
    "B608": ["OWASP A03:2021", "CWE-89", "PCI-DSS 6.3.1"],
    "B609": ["OWASP A03:2021", "CWE-78"],
    "B611": ["OWASP A03:2021", "CWE-89"],
    "B612": ["OWASP A09:2021"],
    "B701": ["OWASP A03:2021", "CWE-94"],
    "B702": ["OWASP A03:2021", "CWE-94"],
    "B703": ["OWASP A03:2021", "CWE-116"],

    # Gitleaks / secrets
    "SECRETS-001": ["OWASP A07:2021", "CWE-798", "PCI-DSS 3.2", "HIPAA §164.312(d)"],
    "GITLEAKS": ["OWASP A07:2021", "CWE-798", "SOC 2 CC6.1", "PCI-DSS 3.2"],

    # Trivy CVEs (generic)
    "CVE": ["OWASP A06:2021", "CWE-1035", "PCI-DSS 6.3.3"],

    # tfsec / Checkov IaC rules
    "AWS": ["SOC 2 CC6.6", "NIST SP 800-53 AC-3", "PCI-DSS 1.3"],
    "GCP": ["SOC 2 CC6.6", "NIST SP 800-53 AC-3"],
    "AZURE": ["SOC 2 CC6.6", "NIST SP 800-53 AC-3"],
    "CKV": ["SOC 2 CC6.6", "NIST SP 800-53 CM-6", "CIS Benchmarks"],
}


def get_framework_fallback(rule_id: str) -> str:
    """
    Given a rule ID, return a comma-separated string of compliance frameworks.
    Returns an empty string if no mapping exists.

    Tries exact match first, then prefix match (e.g. 'CVE-2024-1234' → 'CVE' key).
    """
    # Exact match
    if rule_id in FRAMEWORK_MAP:
        return ", ".join(FRAMEWORK_MAP[rule_id])

    # Prefix match (e.g. CVE-2024-..., CKV_AWS_21, AWS-...)
    for prefix, frameworks in FRAMEWORK_MAP.items():
        if rule_id.upper().startswith(prefix.upper()):
            return ", ".join(frameworks)

    return ""
