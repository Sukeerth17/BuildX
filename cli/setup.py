from setuptools import setup, find_packages

setup(
    name="compliance-cli",
    version="0.1.0",
    packages=find_packages(),
    py_modules=["main", "config", "sarif_writer", "ai_triage", "api_sender", "framework_map"],
    install_requires=[
        "click>=8.1.0",
        "pyyaml>=6.0",
        "bandit>=1.7.0"
    ],
    entry_points={
        "console_scripts": [
            "compliance-cli=main:cli",
        ],
    },
)
