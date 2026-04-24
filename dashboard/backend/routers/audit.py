from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
import httpx
import io
import json
import os
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from database import get_db
from models import Finding
from routers.frameworks import FRAMEWORKS
from compliance_mapping import build_framework_metrics, deserialize_mappings, framework_display_name

router = APIRouter()

class AuditRequest(BaseModel):
    start_date: str
    end_date: str

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

@router.post("/generate")
async def generate_audit_report(req: AuditRequest, db: Session = Depends(get_db)):
    try:
        start_d = datetime.strptime(req.start_date, "%Y-%m-%d").date()
        end_d = datetime.strptime(req.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

    findings = db.query(Finding).filter(
        func.date(Finding.created_at) >= start_d,
        func.date(Finding.created_at) <= end_d
    ).all()

    # Calculate summary
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for f in findings:
        severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

    framework_metrics = build_framework_metrics(findings)

    control_counts = {}
    for finding in findings:
        mappings = deserialize_mappings(finding.compliance_mappings)
        for m in mappings:
            ctrl = m.get("control", {})
            clause = ctrl.get("clause")
            if not clause or clause == "Unknown":
                continue
            
            framework = m.get("framework", "Unknown")
            key = f"{framework} - {clause}"
            if key not in control_counts:
                control_counts[key] = {
                    "count": 0,
                    "excerpt": ctrl.get("excerpt", ""),
                }
            control_counts[key]["count"] += 1

    top_controls = sorted(control_counts.items(), key=lambda x: x[1]["count"], reverse=True)[:6]
    control_summary_text = ", ".join([f"{k} ({v['count']})" for k, v in top_controls]) or "No mapped control data"
    framework_summary_text = ", ".join(
        [
            f"{framework_display_name(fw)} {framework_metrics[fw]['score']:.1f}% across {framework_metrics[fw]['count']} finding(s)"
            for fw in FRAMEWORKS
        ]
    )

    summary_text = f"CRITICAL: {severity_counts['CRITICAL']}, HIGH: {severity_counts['HIGH']}, MEDIUM: {severity_counts['MEDIUM']}, LOW: {severity_counts['LOW']}"

    prompt = f"""You are a DevOps compliance expert. Write a 300-500 word compliance narrative based on these findings from {req.start_date} to {req.end_date}:
Severity Breakdown: {summary_text}
Framework Coverage: {framework_summary_text}
Top impacted controls: {control_summary_text}
Include:
1. Executive summary of the security posture
2. Breakdown by framework
3. Key violated control clauses and why they matter to auditors
Do not include markdown formatting like ** or #. Keep it plain text."""

    narrative = "AI Service offline. Narrative could not be generated."
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            }, timeout=60.0)
            if resp.status_code == 200:
                data = resp.json()
                narrative = data.get("response", narrative)
    except Exception:
        pass

    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph(f"ComplianceAI Audit Report — {req.start_date} to {req.end_date}", styles['Title']))
    story.append(Spacer(1, 12))

    # Narrative
    for p in narrative.split('\n\n'):
        if p.strip():
            story.append(Paragraph(p.strip(), styles['Normal']))
            story.append(Spacer(1, 12))

    story.append(Spacer(1, 24))

    # Severity Table
    story.append(Paragraph("Findings Summary", styles['Heading2']))
    sev_data = [["Severity", "Count"]]
    for k, v in severity_counts.items():
        sev_data.append([k, str(v)])
    
    t_sev = Table(sev_data, colWidths=[200, 100])
    t_sev.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(t_sev)
    story.append(Spacer(1, 24))

    # Framework Table
    story.append(Paragraph("Framework Compliance", styles['Heading2']))
    fw_data = [["Framework", "Compliance %", "Mapped Findings"]]
    for fw in FRAMEWORKS:
        metrics = framework_metrics[fw]
        fw_data.append([
            framework_display_name(fw),
            f"{metrics['score']:.1f}%",
            str(metrics["count"]),
        ])
        
    t_fw = Table(fw_data, colWidths=[200, 100, 100])
    t_fw.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    story.append(t_fw)

    story.append(Spacer(1, 24))
    story.append(Paragraph("Top Violated Control Clauses", styles['Heading2']))

    if top_controls:
        
        # Use Paragraphs for wrapping in the third column
        control_data = [["Control Clause", "Findings", "Control Excerpt"]]
        style_wrapped = styles["Normal"]
        style_wrapped.fontSize = 8.5
        style_wrapped.leading = 11
        
        for key, details in top_controls:
            excerpt_para = Paragraph(details["excerpt"] or "-", style_wrapped)
            control_data.append([key, str(details["count"]), excerpt_para])

        t_controls = Table(control_data, colWidths=[150, 55, 305])
        
        table_styles = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#333333")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (1,1), (1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 10),
            ('BOTTOMPADDING', (0,0), (-1,0), 10),
            ('TOPPADDING', (0,0), (-1,0), 10),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]
        
        # Alternate row shading
        for i in range(1, len(control_data)):
            if i % 2 == 0:
                table_styles.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor("#f9f9f9")))
            else:
                table_styles.append(('BACKGROUND', (0, i), (-1, i), colors.whitesmoke))

        t_controls.setStyle(TableStyle(table_styles))
        story.append(t_controls)
    else:
        story.append(Paragraph("No mapped control data available for this period.", styles['Normal']))
    
    story.append(Spacer(1, 48))
    story.append(Paragraph(f"Generated at: {datetime.utcnow().isoformat()} UTC", styles['Italic']))

    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    headers = {
        'Content-Disposition': f'attachment; filename="audit_report_{req.start_date}_to_{req.end_date}.pdf"'
    }
    
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
