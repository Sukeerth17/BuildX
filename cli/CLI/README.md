# compliance-cli — Person 1's Folder

## Setup

```bash
cd cli
python3.11 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Make the command available

```bash
# From the repo root:
pip install -e .    # if setup.py exists, OR just run with python directly:
python cli/main.py scan --help
```

## Week 1 — Test it works

```bash
# Should print usage and exit cleanly
python cli/main.py scan --help

# Should scan the example file and print SARIF JSON
python cli/main.py scan --file cli/example_vulnerable.py

# Text output (easier to read during dev)
python cli/main.py scan --file cli/example_vulnerable.py --format text

# CI mode — exits with code 1 if HIGH/CRITICAL found
python cli/main.py scan --file cli/example_vulnerable.py --ci
echo "Exit code: $?"
```

## File Structure

```
/cli
├── main.py                  ← entry point, Click commands
├── config.py                ← reads .compliance.yml
├── sarif_writer.py          ← converts findings → SARIF JSON
├── accepted_risks.json      ← suppressed false positives
├── requirements.txt
├── example_vulnerable.py    ← test file with known problems
├── .compliance.yml          ← config (place at repo root in real use)
└── scanners/
    ├── __init__.py
    ├── bandit_runner.py     ← Week 1 ✅
    ├── trivy_runner.py      ← Week 2
    ├── tfsec_runner.py      ← Week 2
    ├── gitleaks_runner.py   ← Week 2
    ├── semgrep_runner.py    ← Week 2
    ├── checkov_runner.py    ← Week 2
    └── kube_runner.py       ← Week 2
```

## Contracts with teammates

**To Person 2:** SARIF JSON is printed to stdout. Run the CLI and capture it.
**To Person 3:** POST to `http://localhost:8000/api/v1/findings` (Week 3).
