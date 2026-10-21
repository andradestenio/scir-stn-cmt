from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "teste_pdfs_scir_com_logo_cemetron.pdf"
LOGO = ROOT / "assets" / "logo-cemetron.png"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#0f2747")
MUTED = colors.HexColor("#64748b")
LINE = colors.HexColor("#cbd5e1")
LIGHT = colors.HexColor("#f8fafc")
PURPLE = colors.HexColor("#7c3aed")
PURPLE_LIGHT = colors.HexColor("#faf5ff")
PURPLE_LABEL = colors.HexColor("#f3e8ff")
GREEN = colors.HexColor("#166534")
GREEN_LIGHT = colors.HexColor("#dcfce7")
GREEN_LABEL = colors.HexColor("#eef5f0")
BLUE = colors.HexColor("#1d4ed8")
BLUE_LIGHT = colors.HexColor("#eff6ff")
BLUE_LABEL = colors.HexColor("#e8eef6")
AMBER = colors.HexColor("#92400e")
AMBER_LIGHT = colors.HexColor("#fef3c7")

styles = getSampleStyleSheet()
body = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9.5,
    leading=14,
    textColor=colors.HexColor("#111827"),
)
small = ParagraphStyle("Small", parent=body, fontSize=8.5, leading=12)
label = ParagraphStyle("Label", parent=small, fontName="Helvetica-Bold", textColor=NAVY)
title = ParagraphStyle(
    "Title",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=18,
    alignment=TA_CENTER,
    textColor=NAVY,
    spaceAfter=2 * mm,
)
subtitle = ParagraphStyle(
    "Subtitle",
    parent=small,
    alignment=TA_CENTER,
    textColor=MUTED,
)


def p(text, style=body):
    return Paragraph(text, style)


def logo_header(document_title, accent):
    rule = Table([[""]], colWidths=[174 * mm], rowHeights=[1.2 * mm])
    rule.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), accent)]))
    return [
        p(document_title, title),
        p("NIR CEMETRON", subtitle),
        Spacer(1, 4 * mm),
        rule,
        Spacer(1, 6 * mm),
    ]


def draw_page_logo(canvas, doc):
    logo_width = 55 * mm
    logo_height = 12.17 * mm
    x = (A4[0] - logo_width) / 2
    y = A4[1] - 20 * mm
    canvas.saveState()
    canvas.drawImage(str(LOGO), x, y, width=logo_width, height=logo_height, mask="auto", preserveAspectRatio=True)
    canvas.restoreState()


def patient_box(patient, origin, request_source, profile, diagnosis, border, background):
    content = (
        f"<b>Paciente:</b> {patient}<br/>"
        f"<b>Unidade de origem:</b> {origin}<br/>"
        f"<b>Origem da solicitação:</b> {request_source}<br/>"
        f"<b>Perfil do paciente:</b> {profile}<br/>"
        f"<b>Hipóteses diagnósticas / Problemas:</b> {diagnosis}"
    )
    table = Table([[p(content)]], colWidths=[174 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("BOX", (0, 0), (-1, -1), 0.8, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def details_table(rows, label_background, border=LINE):
    data = [[p(name, label), value if hasattr(value, "wrap") else p(str(value), small)] for name, value in rows]
    table = Table(data, colWidths=[52 * mm, 122 * mm])
    style = [
        ("BOX", (0, 0), (-1, -1), 0.8, border),
        ("INNERGRID", (0, 0), (-1, -1), 0.6, border),
        ("BACKGROUND", (0, 0), (0, -1), label_background),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]
    table.setStyle(TableStyle(style))
    return table


def status_badge(text, foreground, background, border):
    badge_style = ParagraphStyle(
        "Badge",
        parent=small,
        fontName="Helvetica-Bold",
        textColor=foreground,
        alignment=TA_CENTER,
    )
    badge = Table([[p(text, badge_style)]], colWidths=[48 * mm])
    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("BOX", (0, 0), (-1, -1), 0.8, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return badge


def orientation_box(title_text, text, border, background):
    block = Table(
        [[p(title_text, label)], [p(text, body)]],
        colWidths=[174 * mm],
    )
    block.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("BOX", (0, 0), (-1, -1), 0.8, border),
                ("LINEBELOW", (0, 0), (-1, 0), 0.6, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    return block


def footer():
    left = p("<b>Stênio Andrade</b><br/>Médico Regulador | CRM/RO 6.115<br/>NIR CEMETRON", small)
    right_style = ParagraphStyle("Right", parent=small, alignment=2, textColor=MUTED)
    right = p("Documento de demonstração<br/>18/10/2026 às 23:19", right_style)
    table = Table([[left, right]], colWidths=[110 * mm, 64 * mm])
    table.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, 0), 0.7, LINE),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def transfer_page():
    story = logo_header("INFORME DE TRANSFERÊNCIA EXTERNA", PURPLE)
    story += [
        patient_box(
            "PACIENTE DE DEMONSTRAÇÃO",
            "CEMETRON - CMM2",
            "Interna",
            "Enfermaria",
            "Diagnóstico clínico de demonstração",
            colors.HexColor("#d8b4fe"),
            PURPLE_LIGHT,
        ),
        Spacer(1, 6 * mm),
        details_table(
            [
                ("Situação", status_badge("AUTORIZADA", GREEN, GREEN_LIGHT, colors.HexColor("#86efac"))),
                ("Destino", "Hospital Municipal de Demonstração"),
                ("Enfermaria/Leito", "Enfermaria 2 - Leito 05"),
            ],
            PURPLE_LABEL,
            colors.HexColor("#d8b4fe"),
        ),
        Spacer(1, 6 * mm),
        orientation_box(
            "Informações / Orientações",
            "Transferência autorizada após contato com a unidade de destino. Encaminhar documentação clínica completa e exames disponíveis.",
            colors.HexColor("#d8b4fe"),
            PURPLE_LIGHT,
        ),
        Spacer(1, 16 * mm),
        footer(),
        PageBreak(),
    ]
    return story


def authorization_page():
    story = logo_header("PARECER DO REGULADOR", colors.HexColor("#4caf72"))
    story += [
        patient_box(
            "PACIENTE DE DEMONSTRAÇÃO",
            "UPA ZONA SUL",
            "CRUE",
            "UTI",
            "Diagnóstico clínico de demonstração",
            colors.HexColor("#bbdfc7"),
            colors.HexColor("#f2fbf7"),
        ),
        Spacer(1, 6 * mm),
        details_table(
            [
                ("Desfecho", status_badge("TRANSFERÊNCIA / INTERNAÇÃO AUTORIZADA", GREEN, GREEN_LIGHT, colors.HexColor("#86efac"))),
                ("Vaga / Destino", "CEMETRON - UTI Clínica"),
                ("Enfermaria/Leito", "UTI Clínica - Leito 03"),
            ],
            GREEN_LABEL,
            colors.HexColor("#bbdfc7"),
        ),
        Spacer(1, 6 * mm),
        orientation_box(
            "Orientações",
            "Enviar prontuário, evoluções, prescrições, exames laboratoriais e de imagem, além de evolução de enfermagem atualizada.",
            colors.HexColor("#bbdfc7"),
            colors.HexColor("#f2fbf7"),
        ),
        Spacer(1, 16 * mm),
        footer(),
        PageBreak(),
    ]
    return story


def exam_page():
    story = logo_header("INFORME PARA EXAME", colors.HexColor("#4f8edc"))
    story += [
        patient_box(
            "PACIENTE DE DEMONSTRAÇÃO",
            "PA ANA ADELAIDE",
            "CEREL",
            "Pronto Atendimento",
            "Diagnóstico clínico de demonstração",
            colors.HexColor("#bfdbfe"),
            BLUE_LIGHT,
        ),
        Spacer(1, 6 * mm),
        details_table(
            [
                ("Exame", "Tomografia computadorizada de crânio"),
                ("Local do exame", "Unidade de diagnóstico por imagem"),
                ("Data", "19/10/2026"),
                ("Horário", "10:30"),
            ],
            BLUE_LABEL,
            colors.HexColor("#bfdbfe"),
        ),
        Spacer(1, 6 * mm),
        orientation_box(
            "Orientações",
            "Encaminhar o paciente com antecedência, documentação pertinente, exames prévios e informações clínicas necessárias à realização do exame.",
            colors.HexColor("#bfdbfe"),
            BLUE_LIGHT,
        ),
        Spacer(1, 12 * mm),
        footer(),
    ]
    return story


doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=18 * mm,
    rightMargin=18 * mm,
    topMargin=29 * mm,
    bottomMargin=15 * mm,
    title="Teste dos PDFs do SCIR com logomarca do CEMETRON",
    author="NIR CEMETRON",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=draw_page_logo)])
story = transfer_page() + authorization_page() + exam_page()
doc.build(story)
print(OUTPUT)
