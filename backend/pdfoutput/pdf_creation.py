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

"""



def generate_pdf(
        data: List
) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    
    # Set up basic font
    pdf.set_font("Arial", size=16)
    pdf.cell(200, 10, txt="Sentiment analysis", ln=True, align="C")
    pdf.ln(10) # Add a line break



    for component in data: 
        img_bytes = component["figure"].to_image(format="png", scale=2)
        img_stream = io.BytesIO(img_bytes)
        fig = component["figure"]
        interpretation = component["interpretation"]

        if fig.data: 
            img_bytes = fig.to_image(format="png", scale=2)
            img_stream = io.BytesIO(img_bytes)

            page_width = pdf.w - 2 * pdf.l_margin
            pdf.image(img_stream, w=page_width)
            pdf.ln(5)

        pdf.set_font("Arial", size=11)
        pdf.multi_cell(0, 8, interpretation)
        pdf.ln(10)



    # Output the PDF as a byte string in memory
    pdf_output = pdf.output(dest="S")
    return bytes(pdf_output) 
"""