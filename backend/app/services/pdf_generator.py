import io
import json
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)


def generate_assessment_pdf_report(
    candidate_name: str,
    candidate_email: str,
    assessment_data: Dict[str, Any],
) -> bytes:
    """
    Generates a high-quality, professional PDF Assessment & Skill Gap Report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom Clean Styles
    primary_color = colors.HexColor("#4f46e5")
    dark_bg = colors.HexColor("#0f172a")
    text_color = colors.HexColor("#1e293b")
    accent_teal = colors.HexColor("#0891b2")
    success_green = colors.HexColor("#059669")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
    )

    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#64748b"),
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=text_color,
    )

    bullet_style = ParagraphStyle(
        "BulletText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12.5,
        textColor=text_color,
    )

    elements = []

    # 1. Header Banner
    elements.append(Paragraph("CODEVIGILANT AI", title_style))
    elements.append(Paragraph("Adaptive AI Technical Assessment & Skill Gap Report", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=2, spaceAfter=12))

    # 2. Metadata Grid Table
    role_name = assessment_data.get("role", "Software Engineer")
    a_type = str(assessment_data.get("assessment_type", "Interview")).upper()
    diff = assessment_data.get("difficulty", "Intermediate")
    status = str(assessment_data.get("status", "Completed")).capitalize()
    score = assessment_data.get("score", 0.0)
    integrity = assessment_data.get("integrity_status", "Normal")

    meta_table_data = [
        [
            Paragraph(f"<b>Candidate:</b> {candidate_name}", body_style),
            Paragraph(f"<b>Track / Role:</b> {role_name}", body_style),
        ],
        [
            Paragraph(f"<b>Email:</b> {candidate_email}", body_style),
            Paragraph(f"<b>Assessment Mode:</b> {a_type}", body_style),
        ],
        [
            Paragraph(f"<b>Difficulty:</b> {diff}", body_style),
            Paragraph(f"<b>Status:</b> {status}", body_style),
        ],
    ]

    meta_table = Table(meta_table_data, colWidths=[260, 260])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ])
    )
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # 3. Overall Performance Summary Box
    perf_data = [
        [
            Paragraph(f"<font size=16 color='#4f46e5'><b>{score} / 10</b></font><br/><font size=8 color='#64748b'>Overall Score</font>", body_style),
            Paragraph(f"<b>Integrity Verification:</b> {integrity}<br/><font size=8 color='#64748b'>Anti-Cheating Monitoring</font>", body_style),
            Paragraph(f"<b>Evaluator:</b> Google Gemini 3.6<br/><font size=8 color='#64748b'>AI Assessment Engine</font>", body_style),
        ]
    ]
    perf_table = Table(perf_data, colWidths=[173, 173, 174])
    perf_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#bfdbfe")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    elements.append(perf_table)
    elements.append(Spacer(1, 10))

    # 4. Topic-Wise Performance Breakdown Table
    topic_perf = assessment_data.get("topic_performance", [])
    if topic_perf:
        elements.append(Paragraph("Topic-Wise Competency Analysis", section_heading))
        t_header = [
            Paragraph("<b>Topic</b>", body_style),
            Paragraph("<b>Questions</b>", body_style),
            Paragraph("<b>Correct / Passed</b>", body_style),
            Paragraph("<b>Accuracy</b>", body_style),
        ]
        t_rows = [t_header]
        for tp in topic_perf:
            acc = tp.get("accuracy_percentage", 0)
            t_rows.append([
                Paragraph(tp.get("topic", "General"), body_style),
                Paragraph(str(tp.get("total_questions", 1)), body_style),
                Paragraph(str(tp.get("correct_answers", 0)), body_style),
                Paragraph(f"<b>{acc}%</b>", body_style),
            ])

        t_table = Table(t_rows, colWidths=[200, 100, 110, 110])
        t_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ])
        )
        elements.append(t_table)
        elements.append(Spacer(1, 10))

    # 5. AI Skill Gap Analysis Section
    skill_gap = assessment_data.get("skill_gap_report") or {}
    if skill_gap:
        elements.append(Paragraph("AI Skill-Gap & Competency Evaluation", section_heading))
        if skill_gap.get("summary"):
            elements.append(Paragraph(f"<b>Summary:</b> {skill_gap['summary']}", body_style))
            elements.append(Spacer(1, 6))

        # Strengths & Weaknesses 2-Column Table
        strong_items = skill_gap.get("strong_areas", [])
        weak_items = skill_gap.get("weak_areas", []) or skill_gap.get("skill_gaps", [])

        strong_text = "<br/>".join([f"• {s}" for s in strong_items]) if strong_items else "• Strong core understanding demonstrated."
        weak_text = "<br/>".join([f"• {w}" for w in weak_items]) if weak_items else "• Practice advanced edge cases and concurrency."

        sg_data = [
            [
                Paragraph("<font color='#059669'><b>Demonstrated Strengths</b></font>", body_style),
                Paragraph("<font color='#d97706'><b>Identified Skill Gaps</b></font>", body_style),
            ],
            [
                Paragraph(strong_text, bullet_style),
                Paragraph(weak_text, bullet_style),
            ]
        ]
        sg_table = Table(sg_data, colWidths=[260, 260])
        sg_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0fdf4")),
                ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#fffbeb")),
                ("BOX", (0, 0), (0, -1), 0.5, colors.HexColor("#86efac")),
                ("BOX", (1, 0), (1, -1), 0.5, colors.HexColor("#fde68a")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        elements.append(sg_table)
        elements.append(Spacer(1, 10))

    # 6. Personalized Learning Roadmap
    roadmap = assessment_data.get("learning_roadmap") or []
    if roadmap:
        elements.append(Paragraph("Personalized 4-Week Learning Roadmap", section_heading))
        rm_rows = []
        for step in roadmap:
            week_title = step.get("week", "Phase")
            focus = step.get("topic", "Core Mastery")
            desc = step.get("description", "")
            rm_rows.append([
                Paragraph(f"<b>{week_title}</b>", body_style),
                Paragraph(f"<b>{focus}:</b> {desc}", body_style),
            ])

        rm_table = Table(rm_rows, colWidths=[100, 420])
        rm_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        elements.append(rm_table)

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
