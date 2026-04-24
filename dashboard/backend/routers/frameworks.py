from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from database import get_db
from models import Finding, FrameworkSnapshot
from cache import get_cache, set_cache

router = APIRouter()

FRAMEWORKS = ["soc2", "gdpr", "hipaa", "pcidss", "owasp", "iso27001"]

@router.get("")
def get_frameworks(db: Session = Depends(get_db)):
    cache_key = "complianceai:frameworks"
    cached = get_cache(cache_key)
    if cached:
        return cached

    all_findings = db.query(Finding).all()
    results = {}
    
    for fw in FRAMEWORKS:
        fw_findings = [f for f in all_findings if f.framework and fw.lower() in f.framework.lower()]
        if not fw_findings:
            results[fw] = 100.0
        else:
            passed = sum(1 for f in fw_findings if f.status in ["fixed", "accepted"])
            results[fw] = round((passed / len(fw_findings)) * 100, 1)

    set_cache(cache_key, results, ttl=60)
    return results

@router.get("/snapshots")
def get_snapshots(db: Session = Depends(get_db)):
    # Returns last 30 snapshots
    snapshots = db.query(FrameworkSnapshot).order_by(FrameworkSnapshot.snapshot_date.desc()).limit(30).all()
    return [
        {
            "id": s.id,
            "snapshot_date": s.snapshot_date.isoformat(),
            "soc2": s.soc2,
            "gdpr": s.gdpr,
            "hipaa": s.hipaa,
            "pcidss": s.pcidss,
            "owasp": s.owasp,
            "iso27001": s.iso27001
        } for s in snapshots
    ]
