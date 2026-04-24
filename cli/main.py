"""
compliance-cli — Main entry point
Person 1 owns this file. Do not touch /extension or /dashboard.
"""

import click
import sys
import asyncio
from config import load_config
from scanners.bandit_runner import run_bandit
from scanners.trivy_runner import run_trivy
from scanners.tfsec_runner import run_tfsec
from scanners.gitleaks_runner import run_gitleaks
from scanners.semgrep_runner import run_semgrep
from scanners.checkov_runner import run_checkov
from scanners.kube_runner import run_kube_hunter
from ai_triage import run_ai_triage
from sarif_writer import write_sarif
from api_sender import send_sarif_to_dashboard

import os

# Ensure the .venv/bin directory is in PATH so scanners can be found
venv_bin = os.path.dirname(sys.executable)
if venv_bin not in os.environ["PATH"]:
    os.environ["PATH"] = venv_bin + os.pathsep + os.environ["PATH"]

@click.group()
def cli():
    """ComplianceAI — DevOps Security Scanner"""
    pass


@cli.command()
@click.option("--file", "-f", "-file", required=True, help="Path to the file to scan")
@click.option("--format", "output_format", default="sarif", type=click.Choice(["sarif", "text"]), help="Output format")
@click.option("--ci", is_flag=True, default=False, help="CI mode: exit 1 if critical/high findings found")
def scan(file, output_format, ci):
    """Scan a file for security issues."""
    click.echo(f"[compliance-cli] Scanning: {file}", err=True)

    config = load_config()

    async def run_all():
        # Week 2: Run all scanners in parallel
        scanners = [
            run_bandit(file),
            run_trivy(file),
            run_tfsec(file),
            run_gitleaks(file),
            run_semgrep(file),
            run_checkov(file),
            run_kube_hunter(file)
        ]
        results = await asyncio.gather(*scanners)
        
        # Collect all outputs into one combined list
        all_findings = []
        for result_list in results:
            all_findings.extend(result_list)
            
        # AI Triage
        enriched_findings = await run_ai_triage(all_findings)
        return enriched_findings

    findings = asyncio.run(run_all())

    if output_format == "sarif":
        sarif_output = write_sarif(findings)
        click.echo(sarif_output)
        send_sarif_to_dashboard(sarif_output)
    else:
        if not findings:
            click.echo("No findings.", err=True)
        for f in findings:
            click.echo(
                f"[{f.get('severity', 'UNKNOWN')}] {f.get('rule_id')} "
                f"at line {f.get('line_number')}: {f.get('message')}",
                err=True,
            )

    click.echo(f"[compliance-cli] Done. {len(findings)} finding(s) found.", err=True)

    if ci:
        has_critical = any(
            f.get("severity") in ("CRITICAL", "HIGH") for f in findings
        )
        sys.exit(1 if has_critical else 0)
    
    sys.exit(0)


if __name__ == "__main__":
    cli()
