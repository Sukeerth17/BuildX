import random
from datetime import datetime, timedelta
from database import SessionLocal, Base, engine
from models import Finding, FrameworkSnapshot

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if empty
    if db.query(Finding).count() > 0:
        print("Database already has findings. Skipping seed.")
        return
        
    print("Seeding findings...")
    repos = ["auth-service", "payment-api", "user-portal"]
    frameworks = ["SOC 2 CC6.1", "GDPR Art 32", "HIPAA 164.312", "PCI-DSS 8.2", "OWASP A01:2021", "ISO 27001 A.9"]
    rules = [
        ("B105", "Hardcoded password string detected"),
        ("B106", "Hardcoded AWS Access Key ID"),
        ("CKV_AWS_1", "Ensure IAM policies that allow full admin privileges are not created"),
        ("G401", "Use of weak cryptographic algorithm (MD5)"),
        ("SG001", "Security Group allows open access to port 22")
    ]
    
    severities = ["CRITICAL"]*4 + ["HIGH"]*7 + ["MEDIUM"]*6 + ["LOW"]*3
    random.shuffle(severities)
    
    statuses = ["open"]*12 + ["fixed"]*5 + ["accepted"]*3
    random.shuffle(statuses)
    
    now = datetime.utcnow()
    
    for i in range(20):
        sev = severities[i]
        status = statuses[i]
        rule = random.choice(rules)
        created_at = now - timedelta(days=random.randint(0, 13), hours=random.randint(0, 23))
        
        f = Finding(
            repo=random.choice(repos),
            file_path=f"src/{random.choice(['main.py', 'config.json', 'app.ts', 'auth.js'])}",
            line_number=random.randint(10, 500),
            rule_id=rule[0],
            severity=sev,
            message=rule[1],
            fix_suggestion="AI suggested fix: Use environment variables instead of hardcoded secrets.",
            framework=random.choice(frameworks),
            commit_sha=f"{random.randint(0x1000000, 0xFFFFFFF):x}",
            status=status,
            created_at=created_at
        )
        db.add(f)
        
    print("Seeding snapshots...")
    for i in range(7):
        snap_date = now.date() - timedelta(days=i+1)
        snap = FrameworkSnapshot(
            snapshot_date=snap_date,
            soc2=random.uniform(80.0, 95.0),
            gdpr=random.uniform(85.0, 98.0),
            hipaa=random.uniform(75.0, 90.0),
            pcidss=random.uniform(82.0, 96.0),
            owasp=random.uniform(70.0, 88.0),
            iso27001=random.uniform(85.0, 95.0)
        )
        db.add(snap)
        
    db.commit()
    db.close()
    print("Done!")

if __name__ == "__main__":
    seed_db()
