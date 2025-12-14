from fpdf import FPDF
from config import constants as const

def generate_pdf() -> bytes:
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

    # Set font for data entries
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt=const.TEXT_INPUT)
    

    # Output the PDF as a byte string in memory
    pdf_output = pdf.output(dest="S")
    return pdf_output.encode('latin-1') # Ensure proper encoding for Streamlit download