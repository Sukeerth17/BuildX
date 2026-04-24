import random
from datetime import datetime, timedelta
from database import SessionLocal, Base, engine
from models import Finding, FrameworkSnapshot

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Clearing existing data...")
    db.query(Finding).delete()
    db.query(FrameworkSnapshot).delete()
    db.commit()
        
    print("Seeding 30 days of findings...")
    repos = ["auth-service", "payment-api", "user-portal", "frontend-app", "billing-worker"]
    frameworks = ["SOC 2 CC6.1", "GDPR Art 32", "HIPAA 164.312", "PCI-DSS 8.2", "OWASP A01:2021", "ISO 27001 A.9"]
    rules = [
        ("B105", "Hardcoded password string detected", "CRITICAL"),
        ("B106", "Hardcoded AWS Access Key ID", "CRITICAL"),
        ("CKV_AWS_1", "Ensure IAM policies that allow full admin privileges are not created", "HIGH"),
        ("G401", "Use of weak cryptographic algorithm (MD5)", "HIGH"),
        ("SG001", "Security Group allows open access to port 22", "CRITICAL"),
        ("S101", "Use of assert detected", "LOW"),
        ("B322", "Python 2 input() detected", "MEDIUM"),
        ("B506", "Use of unsafe yaml load", "HIGH")
    ]
    
    statuses = ["open", "fixed", "accepted"]
    status_weights = [0.4, 0.5, 0.1] # 40% open, 50% fixed, 10% accepted
    
    now = datetime.utcnow()
    
    for i in range(150):
        rule = random.choice(rules)
        sev = rule[2]
        status = random.choices(statuses, weights=status_weights)[0]
        created_at = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        
        f = Finding(
            repo=random.choice(repos),
            file_path=f"src/{random.choice(['main.py', 'config.json', 'app.ts', 'auth.js', 'utils.py'])}",
            line_number=random.randint(10, 500),
            rule_id=rule[0],
            severity=sev,
            message=rule[1],
            fix_suggestion="AI suggested fix: Review and refactor according to security best practices.",
            framework=random.choice(frameworks),
            commit_sha=f"{random.randint(0x1000000, 0xFFFFFFF):x}",
            status=status,
            created_at=created_at
        )
        db.add(f)
        
    print("Seeding 30 days of snapshots...")
    for i in range(30):
        snap_date = now.date() - timedelta(days=30-i)
        snap = FrameworkSnapshot(
            snapshot_date=snap_date,
            soc2=random.uniform(70.0 + i*0.5, 95.0), # Upward trend
            gdpr=random.uniform(75.0 + i*0.3, 98.0),
            hipaa=random.uniform(60.0 + i*0.8, 90.0),
            pcidss=random.uniform(80.0, 96.0),
            owasp=random.uniform(65.0 + i*0.5, 88.0),
            iso27001=random.uniform(85.0, 95.0)
        )
        db.add(snap)
        
    db.commit()
    db.close()
    print("Done!")

if __name__ == "__main__":
    seed_db()
