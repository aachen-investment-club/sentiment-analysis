from fpdf import FPDF
from config import constants as const
from typing import List
import plotly 
import io 
from backend.pdfoutput.pdf_components import TemplateAIC, PlotExport





def generate_pdf(data: list) -> bytes:
    pdf = TemplateAIC()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    BORDER = 10
    INNER_PADDING = 5

    safe_x = BORDER + INNER_PADDING
    safe_width = pdf.w - 2 * safe_x

    img_width = safe_width * 0.7
    # ---- Content ----
    for component in data:
        if isinstance(component, PlotExport): 
            component.draw(pdf, safe_x, safe_width, img_width)


    return bytes(pdf.output(dest="S"))

def draw_metrics_row(pdf, component, safe_x, safe_width):
    metrics = [
        ("Correlation", f"{component['correlation']:.2f}"),
        ("Avg Sentiment", f"{component['average_sentiment']:.2f}"),
        ("Documents", str(component['document_count'])),
        ("Overall", component['overall_sentiment']),
    ]

    col_count = len(metrics)
    col_width = safe_width / col_count

    start_y = pdf.get_y()

    # Labels
    pdf.set_font("Arial", size=9)
    for i, (label, _) in enumerate(metrics):
        x = safe_x + i * col_width
        pdf.set_xy(x, start_y)
        pdf.cell(col_width, 6, label, align="C")

    # Values
    pdf.set_font("Arial", "B", 11)
    for i, (_, value) in enumerate(metrics):
        x = safe_x + i * col_width
        pdf.set_xy(x, start_y + 6)
        pdf.cell(col_width, 8, value, align="C")

    # Move cursor below the metrics row
    pdf.set_y(start_y + 16)





