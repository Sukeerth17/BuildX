# compliance_mapping.py
import json
import re

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
    }
}

CATEGORIES = {
    "Injection": ["sql", "injection", "xss", "scripting", "command"],
    "Cryptography": ["encrypt", "cipher", "tls", "ssl", "hash", "md5", "sha1"],
    "Access Control": ["auth", "permission", "access", "login", "credential", "role"],
    "Secrets": ["key", "secret", "token", "password", "api", "aws_access"],
    "Vulnerability": ["cve", "patch", "outdated", "vulnerable", "overflow"],
    "Infrastructure": ["s3", "bucket", "firewall", "sg", "security group", "vpc", "port"]
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
    
    # Logic to map categories to specific framework controls
    if category == "Injection":
        mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["sql_injection"], "confidence": 0.95})
        mappings.append({"framework": "SOC2", "control": COMPLIANCE_DATABASE["SOC2"]["vulnerability_remediation"], "confidence": 0.85})
    
    elif category == "Cryptography":
        mappings.append({"framework": "HIPAA", "control": COMPLIANCE_DATABASE["HIPAA"]["encryption"], "confidence": 0.90})
        mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["encryption"], "confidence": 0.90})
        
    elif category == "Access Control" or category == "Secrets":
        mappings.append({"framework": "SOC2", "control": COMPLIANCE_DATABASE["SOC2"]["logical_access"], "confidence": 0.95})
        mappings.append({"framework": "HIPAA", "control": COMPLIANCE_DATABASE["HIPAA"]["access_control"], "confidence": 0.85})
        
    elif category == "Infrastructure":
        mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["firewall"], "confidence": 0.80})
        
    elif category == "Vulnerability":
        mappings.append({"framework": "SOC2", "control": COMPLIANCE_DATABASE["SOC2"]["vulnerability_remediation"], "confidence": 0.95})
        mappings.append({"framework": "PCI-DSS", "control": COMPLIANCE_DATABASE["PCI-DSS"]["vulnerability_management"], "confidence": 0.90})

    return mappings

def compute_risk_score(severity: str, mappings: list) -> int:
    base_scores = {"CRITICAL": 90, "HIGH": 70, "MEDIUM": 40, "LOW": 10}
    score = base_scores.get(severity.upper(), 10)
    
    # Boost score if multiple frameworks are impacted
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
        "risk_justification": f"Finding impacts {len(mappings)} regulatory frameworks. High confidence mapping based on rule detection."
    }

def canonical_framework_keys(framework: str) -> list:
    f = framework.lower().replace("-", "").replace(" ", "").replace("_", "")
    if "soc2" in f: return ["SOC2"]
    if "gdpr" in f: return ["GDPR"]
    if "hipaa" in f: return ["HIPAA"]
    if "pcidss" in f or "pci" in f: return ["PCI-DSS"]
    if "owasp" in f: return ["OWASP"]
    if "iso27001" in f: return ["ISO27001"]
    return []

def framework_matches(stored: str, requested: str) -> bool:
    if not stored or not requested: return False
    s_keys = canonical_framework_keys(stored)
    r_keys = canonical_framework_keys(requested)
    return any(k in s_keys for k in r_keys)

def serialize_mappings(mappings: list) -> str:
    return json.dumps(mappings)

def deserialize_mappings(mappings_str: str) -> list:
    if not mappings_str: return []
    try:
        return json.loads(mappings_str)
    except:
        return []
