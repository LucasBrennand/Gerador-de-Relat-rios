import os
from datetime import datetime
from calendar import monthrange
from io import BytesIO
from xml.sax.saxutils import escape

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

app = FastAPI(title="Gerador de Relatório Mensal")
frontend_origins = [origin.strip().rstrip("/") for origin in os.getenv("FRONTEND_ORIGINS", "").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", *frontend_origins], allow_methods=["*"], allow_headers=["*"])


def money(value: float) -> str:
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/report")
async def generate_report(
    month: str = Form(...), company: str = Form(...), cnpj: str = Form(""), phone: str = Form(""),
    email: str = Form(""), address: str = Form(""), sales_text: str = Form(...),
    graph: UploadFile | None = File(default=None), company_logo: UploadFile | None = File(default=None),
):
    try:
        start = datetime.strptime(month, "%Y-%m")
    except ValueError as exc:
        raise HTTPException(400, "Selecione um mês válido.") from exc
    sales = []
    for line_no, line in enumerate(sales_text.splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        parts = line.replace("\t", ";").split(";")
        if len(parts) < 2:
            parts = line.split()
        if len(parts) < 2:
            raise HTTPException(400, f"Linha {line_no}: use data e valor, por exemplo 01/08/2026; 1.287,00.")
        date_text, amount_text = parts[0].strip(), parts[1].strip()
        try:
            date = datetime.strptime(date_text, "%d/%m/%Y")
            amount = float(amount_text.replace("R$", "").replace(" ", "").replace(".", "").replace(",", "."))
        except ValueError as exc:
            raise HTTPException(400, f"Linha {line_no}: não consegui ler a data ou o valor.") from exc
        if date.year != start.year or date.month != start.month:
            raise HTTPException(400, f"Linha {line_no}: a data precisa estar dentro do mês selecionado.")
        if amount < 0:
            raise HTTPException(400, f"Linha {line_no}: o valor não pode ser negativo.")
        sales.append((date, amount))
    if not sales:
        raise HTTPException(400, "Inclua pelo menos uma venda diária.")
    sales.sort(key=lambda item: item[0])
    total = sum(amount for _, amount in sales)
    month_label = start.strftime("%m/%Y")
    stream = BytesIO()
    styles = getSampleStyleSheet()
    title = ParagraphStyle("title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=colors.black, alignment=TA_CENTER, spaceAfter=4)
    subtitle = ParagraphStyle("subtitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=colors.black, alignment=TA_CENTER)
    sub = ParagraphStyle("sub", parent=styles["Normal"], fontSize=8.5, leading=13, textColor=colors.black)
    period = ParagraphStyle("period", parent=styles["Normal"], fontSize=9, leading=13, textColor=colors.black, alignment=TA_CENTER)
    section = ParagraphStyle("section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=15, textColor=colors.black, leading=18, spaceBefore=2, spaceAfter=5)
    doc = SimpleDocTemplate(stream, pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=18*mm, bottomMargin=16*mm, title=f"Relatório mensal de vendas - {month_label}", author=company)
    story = [Paragraph("GERENCIADOR NOTA FISCAL CONSUMIDOR ELETRÔNICA", title), Paragraph("Bling - NFCe relatório mensal de vendas", subtitle), Spacer(1, 4*mm), Paragraph(f"PERÍODO: De <b>01/{start.strftime('%m/%Y')}</b> &nbsp;&nbsp;&nbsp;&nbsp; Até &nbsp;&nbsp;&nbsp;&nbsp; <b>{monthrange(start.year, start.month)[1]:02d}/{start.strftime('%m/%Y')}</b>", period), Spacer(1, 11*mm)]
    details = [x for x in [escape(company), f"Telefone: {escape(phone)}" if phone else "", f"Email: <font color='#1558aa'><u>{escape(email)}</u></font>" if email else "", f"CNPJ: {escape(cnpj)}" if cnpj else "", escape(address)] if x]
    info = Paragraph("<br/>".join(details), sub)
    logo_image = None
    if company_logo and company_logo.filename:
        logo_bytes = await company_logo.read()
        if len(logo_bytes) > 8*1024*1024:
            raise HTTPException(400, "A logo deve ter até 8 MB.")
        try:
            from PIL import Image as PILImage
            probe = PILImage.open(BytesIO(logo_bytes)); probe.verify()
            logo_image = Image(BytesIO(logo_bytes), width=27*mm, height=33*mm, kind="proportional")
        except Exception as exc:
            raise HTTPException(400, "Não consegui abrir a logo. Envie um PNG ou JPG válido.") from exc
    contact = Table([[logo_image or "", info]], colWidths=[34*mm, 138*mm])
    contact.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "MIDDLE"), ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 2), ("TOPPADDING", (0,0), (-1,-1), 0), ("BOTTOMPADDING", (0,0), (-1,-1), 0)]))
    story += [contact, Spacer(1, 5*mm), Paragraph("Período", sub), Paragraph(f"Mês {month_label}", sub), Paragraph("Evolução do Faturamento", section), Spacer(1, 7*mm)]
    rows = [["Período", "Valor"]] + [[date.strftime("%d/%m/%Y"), money(amount).replace("R$ ", "")] for date, amount in sales] + [["Total", money(total).replace("R$ ", "")]]
    table = Table(rows, colWidths=[90*mm, 82*mm], repeatRows=1)
    table.setStyle(TableStyle([("TEXTCOLOR", (0,0), (-1,-1), colors.HexColor("#111827")), ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("FONTNAME", (0,-1), (-1,-1), "Helvetica-Bold"), ("FONTSIZE", (0,0), (-1,-1), 9), ("ALIGN", (1,0), (1,-1), "RIGHT"), ("ALIGN", (0,0), (0,-1), "LEFT"), ("LINEBELOW", (0,0), (-1,0), .6, colors.HexColor("#b9c8d7")), ("LINEBELOW", (0,1), (-1,-2), .4, colors.HexColor("#b9c8d7")), ("LINEABOVE", (0,-1), (-1,-1), .6, colors.HexColor("#b9c8d7")), ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7), ("LEFTPADDING", (0,0), (-1,-1), 10), ("RIGHTPADDING", (0,0), (-1,-1), 10)]))
    story += [table]
    if graph and graph.filename:
        content = await graph.read()
        if len(content) > 8*1024*1024:
            raise HTTPException(400, "A imagem do gráfico deve ter até 8 MB.")
        try:
            from PIL import Image as PILImage
            probe = PILImage.open(BytesIO(content)); probe.verify()
            img = Image(BytesIO(content), width=172*mm, height=86*mm, kind="proportional")
        except Exception as exc:
            raise HTTPException(400, "Não consegui abrir a imagem. Envie um PNG ou JPG válido.") from exc
        story += [Spacer(1, 5*mm), KeepTogether([Paragraph("Evolução de notas fiscais", section), img])]
    doc.build(story)
    stream.seek(0)
    filename = f"relatorio-vendas-{start.strftime('%Y-%m')}.pdf"
    return StreamingResponse(stream, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})
