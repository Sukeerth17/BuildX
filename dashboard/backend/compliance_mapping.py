# compliance_mapping.py
import json

FRAMEWORK_KEY_ORDER = ["soc2", "gdpr", "hipaa", "pcidss", "owasp", "iso27001"]
FRAMEWORK_CANONICAL_NAMES = {
    "soc2": "SOC2",
    "gdpr": "GDPR",
    "hipaa": "HIPAA",
    "pcidss": "PCI-DSS",
    "owasp": "OWASP",
    "iso27001": "ISO27001",
}
FRAMEWORK_DISPLAY_NAMES = {
    "soc2": "SOC 2",
    "gdpr": "GDPR",
    "hipaa": "HIPAA",
    "pcidss": "PCI-DSS",
    "owasp": "OWASP Top 10",
    "iso27001": "ISO 27001",
}

COMPLIANCE_DATABASE = {
    "HIPAA": {
        "access_control": {
            "clause": "§164.312(a)(1)",
            "excerpt": "Implement technical policies and procedures for electronic information systems that maintain protected health information to allow access only to those persons or software programs that have been granted access rights.",
            "rationale": "Unauthorized access to PHI is a primary HIPAA violation."
        },
        "encryption": {
            "clause": "§164.312(e)(1)",
            "excerpt": "Implement a mechanism to encrypt electronic protected health information whenever deemed appropriate.",
            "rationale": "Data at rest and in transit must be protected to prevent disclosure."
        },
        "audit_controls": {
            "clause": "§164.312(b)",
            "excerpt": "Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information.",
            "rationale": "Audit logs are necessary for post-incident forensic analysis."
        }
    },
    "PCI-DSS": {
        "firewall": {
            "clause": "Requirement 1",
            "excerpt": "Install and maintain a firewall configuration to protect cardholder data.",
            "rationale": "Network segmentation is critical for scope reduction."
        },
        "encryption": {
            "clause": "Requirement 4",
            "excerpt": "Encrypt transmission of cardholder data across open, public networks.",
            "rationale": "Cleartext transmission of PAN is a major risk."
        },
        "vulnerability_management": {
            "clause": "Requirement 6",
            "excerpt": "Develop and maintain secure systems and applications.",
            "rationale": "Software vulnerabilities are common entry points for card theft."
        },
        "sql_injection": {
            "clause": "Req 6.5.1",
            "excerpt": "Prevent SQL injection vulnerabilities by validating all user-supplied input.",
            "rationale": "Direct database manipulation can lead to total data loss."
        },
        "default_passwords": {
            "clause": "Requirement 2",
            "excerpt": "Do not use vendor-supplied defaults for system passwords and other security parameters.",
            "rationale": "Default credentials are the easiest path for attackers."
        }
    },
    "SOC2": {
        "logical_access": {
            "clause": "CC6.1",
            "excerpt": "The entity restricts logical access to confidential information, and other information assets to authorized users and processes.",
            "rationale": "Access control is a core pillar of the Security Trust Service Criteria."
        },
        "change_management": {
            "clause": "CC8.1",
            "excerpt": "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to software, data structures, and infrastructure to meet its objectives.",
            "rationale": "Uncontrolled changes introduce instability and security regressions."
        },
        "vulnerability_remediation": {
            "clause": "CC7.1",
            "excerpt": "To meet its objectives, the entity uses detection and monitoring procedures to identify (1) susceptibility to vulnerabilities...",
            "rationale": "Continuous monitoring is required to maintain a secure posture."
        }
    },
    "GDPR": {
        "security_of_processing": {
            "clause": "Article 32",
            "excerpt": "Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk.",
            "rationale": "Technical safeguards are legally mandated for personal data."
        }
    },
    "ISO27001": {
        "vulnerability_mgmt": {
            "clause": "Annex A.8.8",
            "excerpt": "Information about technical vulnerabilities of information systems being used shall be obtained in a timely fashion...",
            "rationale": "Systematic vulnerability management is key to ISO compliance."
        }
    },
    "OWASP": {
        "broken_access_control": {
            "clause": "A01:2021",
            "excerpt": "Access control enforces policy such that users cannot act outside of their intended permissions.",
            "rationale": "Broken access control is the #1 web security risk."
        }
    }
}

CATEGORIES = {
    "Injection": ["sql", "injection", "xss", "scripting", "command"],
    "Cryptography": ["encrypt", "cipher", "tls", "ssl", "hash", "md5", "sha1", "weak"],
    "Access Control": ["auth", "permission", "access", "login", "credential", "role", "privilege", "admin", "password"],
    "Secrets": ["key", "secret", "token", "password", "api", "aws_access", "hardcoded"],
    "Vulnerability": ["cve", "patch", "outdated", "vulnerable", "overflow", "version"],
    "Infrastructure": ["s3", "bucket", "firewall", "sg", "security group", "vpc", "port", "ingress", "egress"]
}

def detect_category(rule_id: str, message: str, fix: str = "") -> str:
    text = f"{rule_id} {message} {fix}".lower()
    for category, keywords in CATEGORIES.items():
        if any(kw in text for kw in keywords):
            return category
    return "General Security"

def map_finding_to_compliance(rule_id: str, message: str, fix: str = "") -> list:
    category = detect_category(rule_id, message, fix)
    mappings = []
    
    if category == "Injection":
        mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["sql_injection"], "confidence": 0.95})
        mappings.append({"framework": "SOC2", "control": COMPLIANCE_DATABASE["SOC2"]["vulnerability_remediation"], "confidence": 0.85})
    
    elif category == "Cryptography":
        mappings.append({"framework": "HIPAA", "control": COMPLIANCE_DATABASE["HIPAA"]["encryption"], "confidence": 0.90})
        mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["encryption"], "confidence": 0.90})
        mappings.append({"framework": "GDPR", "control": COMPLIANCE_DATABASE["GDPR"]["security_of_processing"], "confidence": 0.80})
        
    elif category == "Access Control" or category == "Secrets":
        mappings.append({"framework": "SOC2", "control": COMPLIANCE_DATABASE["SOC2"]["logical_access"], "confidence": 0.95})
        mappings.append({"framework": "HIPAA", "control": COMPLIANCE_DATABASE["HIPAA"]["access_control"], "confidence": 0.85})
        mappings.append({"framework": "OWASP", "control": COMPLIANCE_DATABASE["OWASP"]["broken_access_control"], "confidence": 0.90})
        if "password" in f"{rule_id} {message}".lower():
            mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["default_passwords"], "confidence": 0.95})
        
    elif category == "Infrastructure":
        mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["firewall"], "confidence": 0.80})
        
    elif category == "Vulnerability":
        mappings.append({"framework": "SOC2", "control": COMPLIANCE_DATABASE["SOC2"]["vulnerability_remediation"], "confidence": 0.95})
        mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["vulnerability_management"], "confidence": 0.90})
        mappings.append({"framework": "ISO27001", "control": COMPLIANCE_DATABASE["ISO27001"]["vulnerability_mgmt"], "confidence": 0.90})

    return mappings

def compute_risk_score(severity: str, mappings: list) -> int:
    base_scores = {"CRITICAL": 90, "HIGH": 70, "MEDIUM": 40, "LOW": 10}
    score = base_scores.get(severity.upper(), 10)
    if len(mappings) > 1:
        score = min(100, score + (len(mappings) * 5))
    return score

def get_comprehensive_mapping(rule_id: str, message: str, severity: str, fix: str = "") -> dict:
    mappings = map_finding_to_compliance(rule_id, message, fix)
    risk_score = compute_risk_score(severity, mappings)
    
    return {
        "category": detect_category(rule_id, message, fix),
        "mappings": mappings,
        "risk_score": risk_score,
        "risk_justification": f"Finding impacts {len(mappings)} regulatory frameworks. High confidence mapping based on rule detection." if mappings else "General security finding with no direct regulatory mapping."
    }

def canonical_framework_key(framework: str | None) -> str | None:
    if not framework:
        return None

    f = framework.lower().replace("-", "").replace(" ", "").replace("_", "")
    if "soc2" in f:
        return "soc2"
    if "gdpr" in f:
        return "gdpr"
    if "hipaa" in f:
        return "hipaa"
    if "pcidss" in f or "pci" in f:
        return "pcidss"
    if "owasp" in f:
        return "owasp"
    if "iso27001" in f:
        return "iso27001"
    return None

def canonical_framework_keys(framework: str) -> list:
    key = canonical_framework_key(framework)
    if not key:
        return []
    return [FRAMEWORK_CANONICAL_NAMES[key]]

def framework_matches(stored: str, requested: str) -> bool:
    if not stored or not requested: return False
    s_key = canonical_framework_key(stored)
    r_key = canonical_framework_key(requested)
    return bool(s_key and r_key and s_key == r_key)

def framework_display_name(framework_key: str) -> str:
    return FRAMEWORK_DISPLAY_NAMES.get(framework_key, framework_key.upper())

def _extract_field(item, field: str):
    if isinstance(item, dict):
        return item.get(field)
    return getattr(item, field, None)

def serialize_mappings(mappings: list) -> str:
    return json.dumps(mappings)

def deserialize_mappings(mappings_payload) -> list:
    if not mappings_payload:
        return []
    if isinstance(mappings_payload, list):
        return mappings_payload
    if not isinstance(mappings_payload, str):
        return []
    try:
        data = json.loads(mappings_payload)
        return data if isinstance(data, list) else []
    except Exception:
        return []

def get_mapped_framework_keys(mappings_payload, stored_framework: str | None = None) -> list[str]:
    keys = []
    for mapping in deserialize_mappings(mappings_payload):
        key = canonical_framework_key(mapping.get("framework"))
        if key and key not in keys:
            keys.append(key)

    if not keys:
        legacy_key = canonical_framework_key(stored_framework)
        if legacy_key:
            keys.append(legacy_key)

    return keys

def get_mapped_framework_names(mappings_payload, stored_framework: str | None = None) -> list[str]:
    return [FRAMEWORK_CANONICAL_NAMES[key] for key in get_mapped_framework_keys(mappings_payload, stored_framework)]

def finding_matches_framework(stored_framework: str | None, mappings_payload, requested_framework: str) -> bool:
    requested_key = canonical_framework_key(requested_framework)
    if not requested_key:
        return False
    return requested_key in get_mapped_framework_keys(mappings_payload, stored_framework)

def get_category_label(stored_framework: str | None, rule_id: str, message: str, fix: str = "") -> str:
    if stored_framework and not canonical_framework_key(stored_framework):
        return stored_framework
    return detect_category(rule_id, message, fix)

def build_framework_metrics(findings: list) -> dict:
    metrics = {}
    for framework_key in FRAMEWORK_KEY_ORDER:
        total = 0
        passed = 0
        for finding in findings:
            stored_framework = _extract_field(finding, "framework")
            mappings_payload = _extract_field(finding, "compliance_mappings")
            if not finding_matches_framework(stored_framework, mappings_payload, framework_key):
                continue

            total += 1
            if _extract_field(finding, "status") in ["fixed", "accepted"]:
                passed += 1

        metrics[framework_key] = {
            "score": 100.0 if total == 0 else round((passed / total) * 100, 1),
            "count": total,
        }

    return metrics
