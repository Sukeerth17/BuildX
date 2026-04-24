from celery import Celery
from datetime import datetime
import sys
import os

# Add parent dir to path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import FrameworkSnapshot, Finding

# Optional: configure celery to use Redis as broker
celery_app = Celery("tasks", broker=os.getenv("REDIS_URL", "redis://localhost:6379"))

@celery_app.task
def generate_nightly_snapshot():
    db = SessionLocal()
    try:
        all_findings = db.query(Finding).all()
        FRAMEWORKS = ["soc2", "gdpr", "hipaa", "pcidss", "owasp", "iso27001"]
        results = {}
        
        for fw in FRAMEWORKS:
            fw_findings = [f for f in all_findings if f.framework and fw.lower() in f.framework.lower()]
            if not fw_findings:
                results[fw] = 100.0
            else:
                passed = sum(1 for f in fw_findings if f.status in ["fixed", "accepted"])
                results[fw] = round((passed / len(fw_findings)) * 100, 1)

        snapshot = FrameworkSnapshot(
            snapshot_date=datetime.utcnow().date(),
            soc2=results["soc2"],
            gdpr=results["gdpr"],
            hipaa=results["hipaa"],
            pcidss=results["pcidss"],
            owasp=results["owasp"],
            iso27001=results["iso27001"]
        )
        db.add(snapshot)
        db.commit()
    finally:
        db.close()
