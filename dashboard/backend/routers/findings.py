from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
import json

from database import get_db
from models import Finding
from routers.auth import get_current_user
from websocket_manager import manager
from cache import get_cache, set_cache, invalidate_pattern
from compliance_mapping import (
    deserialize_mappings,
    finding_matches_framework,
    get_category_label,
    get_comprehensive_mapping,
    get_mapped_framework_names,
    serialize_mappings,
)

router = APIRouter()

def _finding_to_dict(f: Finding) -> Dict[str, Any]:
    mappings = deserialize_mappings(f.compliance_mappings)
    return {
        "id": f.id,
        "repo": f.repo,
        "file_path": f.file_path,
        "line_number": f.line_number,
        "rule_id": f.rule_id,
        "severity": f.severity,
        "message": f.message,
        "fix_suggestion": f.fix_suggestion,
        "plain_english": f.plain_english,
        "framework": f.framework,
        "category": get_category_label(f.framework, f.rule_id, f.message, f.fix_suggestion),
        "mapped_frameworks": get_mapped_framework_names(mappings, f.framework),
        "compliance_mappings": mappings,
        "risk_score": f.risk_score,
        "risk_justification": f.risk_justification,
        "scanner": f.scanner,
        "is_false_positive": f.is_false_positive,
        "commit_sha": f.commit_sha,
        "status": f.status,
        "created_at": f.created_at.isoformat()
    }

@router.post("")
async def create_findings(body: Dict[Any, Any], db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    try:
        commit_sha = body.get("commit_sha", "unknown")
        runs = body.get("runs", [])
        if not runs:
            return {"received": True, "count": 0}
        
        results = runs[0].get("results", [])
        count = 0
        
        for result in results:
            try:
                rule_id = result.get("ruleId", "unknown")
                message = result.get("message", {}).get("text", "")
                
                locations = result.get("locations", [])
                file_path = "unknown"
                line_number = 0
                if locations:
                    phys_loc = locations[0].get("physicalLocation", {})
                    file_path = phys_loc.get("artifactLocation", {}).get("uri", "unknown")
                    line_number = phys_loc.get("region", {}).get("startLine", 0)
                
                props = result.get("properties", {})
                severity = props.get("severity", "LOW")
                fix_suggestion = props.get("fix", "")
                scanner = props.get("scanner", "unknown")
                plain_english = props.get("plain_english", "")
                is_false_positive = 1 if props.get("is_false_positive", False) else 0

                # Unified mapping engine
                mapping_data = get_comprehensive_mapping(rule_id, message, severity, fix_suggestion)

                # Parse repo name from file_path (first segment)
                repo = "unknown"
                if file_path != "unknown" and "/" in file_path:
                    repo = file_path.split("/")[0]
                elif file_path != "unknown":
                    repo = file_path

                new_finding = Finding(
                    repo=repo,
                    file_path=file_path,
                    line_number=line_number,
                    rule_id=rule_id,
                    severity=severity,
                    message=message,
                    fix_suggestion=fix_suggestion,
                    framework=mapping_data["category"],
                    compliance_mappings=serialize_mappings(mapping_data["mappings"]),
                    risk_score=mapping_data["risk_score"],
                    risk_justification=mapping_data["risk_justification"],
                    commit_sha=commit_sha,
                    scanner=scanner,
                    plain_english=plain_english,
                    is_false_positive=is_false_positive,
                )
                db.add(new_finding)
                db.commit()
                db.refresh(new_finding)
                count += 1
                
                # Broadcast
                await manager.broadcast({"event": "new_finding", "data": _finding_to_dict(new_finding)})
            except Exception as e:
                db.rollback()
                pass
        
        invalidate_pattern("complianceai:findings:*")
        invalidate_pattern("complianceai:summary")
        invalidate_pattern("complianceai:trend")
        invalidate_pattern("complianceai:frameworks")
        
        return {"received": True, "count": count}
    except Exception as e:
        return {"received": True, "count": 0}

@router.get("")
def get_findings(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    repo: Optional[str] = None,
    framework: Optional[str] = None,
    db: Session = Depends(get_db)
):
    cache_key = f"complianceai:findings:all:{severity}:{status}:{repo}:{framework}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    query = db.query(Finding)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    if repo:
        query = query.filter(Finding.repo == repo)
    
    findings = query.order_by(Finding.id.desc()).all()
    
    if framework:
        findings = [f for f in findings if finding_matches_framework(f.framework, f.compliance_mappings, framework)]
    
    result = [_finding_to_dict(f) for f in findings]
    set_cache(cache_key, result, ttl=60)
    return result

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    cache_key = "complianceai:summary"
    cached = get_cache(cache_key)
    if cached:
        return cached

    all_findings = db.query(Finding).all()
    if not all_findings:
        res = {"critical": 0, "high": 0, "medium": 0, "low": 0, "pass_rate": 0.0}
        set_cache(cache_key, res, ttl=60)
        return res

    critical = sum(1 for f in all_findings if f.severity == "CRITICAL")
    high = sum(1 for f in all_findings if f.severity == "HIGH")
    medium = sum(1 for f in all_findings if f.severity == "MEDIUM")
    low = sum(1 for f in all_findings if f.severity == "LOW")
    
    passed = sum(1 for f in all_findings if f.status in ["fixed", "accepted"])
    pass_rate = (passed / len(all_findings)) * 100

    res = {
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "pass_rate": round(pass_rate, 1)
    }
    set_cache(cache_key, res, ttl=60)
    return res

@router.get("/trend")
def get_trend(db: Session = Depends(get_db)):
    cache_key = "complianceai:trend"
    cached = get_cache(cache_key)
    if cached:
        return cached

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=13)
    
    findings = db.query(Finding).filter(func.date(Finding.created_at) >= start_date).all()
    
    by_date = {}
    for i in range(14):
        d = start_date + timedelta(days=i)
        by_date[d] = {"total": 0, "passed": 0}
        
    for f in findings:
        d = f.created_at.date()
        if d in by_date:
            by_date[d]["total"] += 1
            if f.status in ["fixed", "accepted"]:
                by_date[d]["passed"] += 1
                
    result = []
    for d, counts in by_date.items():
        if counts["total"] > 0:
            rate = (counts["passed"] / counts["total"]) * 100
        else:
            rate = 100.0
        result.append({
            "date": d.isoformat(),
            "pass_rate": round(rate, 1)
        })
        
    set_cache(cache_key, result, ttl=60)
    return result

@router.patch("/{finding_id}/status")
def update_status(finding_id: int, body: Dict[str, str], db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    new_status = body.get("status")
    if new_status not in ["open", "fixed", "accepted"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    finding.status = new_status
    db.commit()
    db.refresh(finding)
    
    invalidate_pattern("complianceai:findings:*")
    invalidate_pattern("complianceai:summary")
    invalidate_pattern("complianceai:trend")
    invalidate_pattern("complianceai:frameworks")
    
    return _finding_to_dict(finding)
