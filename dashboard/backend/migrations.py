# migrations.py
import json
from sqlalchemy import create_engine, text, inspect
from database import DATABASE_URL
from compliance_mapping import get_comprehensive_mapping

def run_migrations():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        columns = [c["name"] for c in inspector.get_columns("findings")]
        
        # Add compliance_mappings if missing
        if "compliance_mappings" not in columns:
            print("[migration] Adding compliance_mappings column...")
            conn.execute(text("ALTER TABLE findings ADD COLUMN compliance_mappings TEXT"))
            conn.commit()
            
        # Add risk_score if missing
        if "risk_score" not in columns:
            print("[migration] Adding risk_score column...")
            conn.execute(text("ALTER TABLE findings ADD COLUMN risk_score INTEGER DEFAULT 0"))
            conn.commit()

        # Add risk_justification if missing
        if "risk_justification" not in columns:
            print("[migration] Adding risk_justification column...")
            conn.execute(text("ALTER TABLE findings ADD COLUMN risk_justification TEXT"))
            conn.commit()

        # Add scanner if missing
        if "scanner" not in columns:
            print("[migration] Adding scanner column...")
            conn.execute(text("ALTER TABLE findings ADD COLUMN scanner VARCHAR(50) DEFAULT 'unknown'"))
            conn.commit()

        # Add plain_english if missing
        if "plain_english" not in columns:
            print("[migration] Adding plain_english column...")
            conn.execute(text("ALTER TABLE findings ADD COLUMN plain_english TEXT DEFAULT ''"))
            conn.commit()

        # Add is_false_positive if missing
        if "is_false_positive" not in columns:
            print("[migration] Adding is_false_positive column...")
            conn.execute(text("ALTER TABLE findings ADD COLUMN is_false_positive INTEGER DEFAULT 0"))
            conn.commit()

def backfill_legacy_findings():
    from database import SessionLocal
    from models import Finding
    
    db = SessionLocal()
    try:
        # Re-map if mappings are missing, empty, or if risk metadata is missing
        findings = db.query(Finding).filter(
            (Finding.compliance_mappings == None) | 
            (Finding.compliance_mappings == "[]") | 
            (Finding.risk_score == 0)
        ).all()
        
        if not findings:
            print("[backfill] No findings require enrichment.")
            return
            
        print(f"[backfill] Found {len(findings)} legacy findings to enrich.")
        for f in findings:
            mapping_data = get_comprehensive_mapping(f.rule_id, f.message, f.severity, f.fix_suggestion)
            f.compliance_mappings = json.dumps(mapping_data["mappings"])
            f.risk_score = mapping_data["risk_score"]
            f.risk_justification = mapping_data["risk_justification"]
            
        db.commit()
        print("[backfill] Successfully enriched legacy findings.")
    except Exception as e:
        print(f"[backfill] ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migrations()
    backfill_legacy_findings()
