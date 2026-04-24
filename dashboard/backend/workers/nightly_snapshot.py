from celery import Celery
from datetime import datetime
import sys
import os

# Add parent dir to path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import FrameworkSnapshot, Finding
from compliance_mapping import FRAMEWORK_KEY_ORDER, build_framework_metrics

# Optional: configure celery to use Redis as broker
celery_app = Celery("tasks", broker=os.getenv("REDIS_URL", "redis://localhost:6379"))

@celery_app.task
def generate_nightly_snapshot():
    db = SessionLocal()
    try:
        all_findings = db.query(Finding).all()
        metrics = build_framework_metrics(all_findings)
        results = {fw: metrics[fw]["score"] for fw in FRAMEWORK_KEY_ORDER}

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
