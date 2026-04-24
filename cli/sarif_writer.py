"""
sarif_writer.py — Converts findings list into SARIF 2.1 JSON
Person 1 owns this. Person 2 reads the output. Do NOT change the
structure without telling Person 2.

SARIF contract (agreed with Person 2):
  runs[0].results  →  array of findings
  Each finding has:
    ruleId
    message.text
    locations[0].physicalLocation.artifactLocation.uri
    locations[0].physicalLocation.region.startLine
    properties.severity   ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW")
    properties.fix        (AI fix suggestion text)
    properties.framework  (e.g. "OWASP A03:2021", "SOC 2 CC6.7")
"""

import json
from typing import List, Dict


def write_sarif(findings: List[Dict]) -> str:
    """Return a SARIF 2.1 JSON string for the given findings."""

    results = []
    for f in findings:
        results.append({
            "ruleId": f.get("rule_id", "UNKNOWN"),
            "message": {
                "text": f.get("message", "")
            },
            "locations": [
                {
                    "physicalLocation": {
                        "artifactLocation": {
                            "uri": f.get("file_path", "")
                        },
                        "region": {
                            "startLine": f.get("line_number", 1)
                        }
                    }
                }
            ],
            "properties": {
                "severity": f.get("severity", "LOW"),
                "fix": f.get("fix_suggestion", ""),
                "framework": f.get("framework", ""),
            }
        })

    sarif = {
        "version": "2.1.0",
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "compliance-cli",
                        "version": "1.0.0"
                    }
                },
                "results": results
            }
        ]
    }

    return json.dumps(sarif, indent=2)
