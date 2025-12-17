from fpdf import FPDF
from config import constants as const
from typing import List
import plotly 
import io 

def generate_pdf(
        data: List
) -> bytes:
    """
    Generates a simple PDF document from a dictionary.
    Returns the PDF data as bytes.
    """
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