from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Date, func
from database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    repo = Column(String(255), index=True)
    file_path = Column(String(500))
    line_number = Column(Integer)
    rule_id = Column(String(100), index=True)
    severity = Column(String(20), index=True)
    message = Column(Text)
    fix_suggestion = Column(Text)
    framework = Column(String(100), index=True)
    commit_sha = Column(String(40), index=True)
    created_at = Column(DateTime, default=func.now())
    status = Column(String(20), default="open", index=True)

class FrameworkSnapshot(Base):
    __tablename__ = "framework_snapshots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    snapshot_date = Column(Date, index=True)
    soc2 = Column(Float)
    gdpr = Column(Float)
    hipaa = Column(Float)
    pcidss = Column(Float)
    owasp = Column(Float)
    iso27001 = Column(Float)
    created_at = Column(DateTime, default=func.now())
