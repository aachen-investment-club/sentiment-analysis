from fpdf import FPDF

def generate_pdf(data: dict) -> bytes:
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
    
    # Iterate through the dictionary and add rows to the PDF
    for key, value in data.items():
        if isinstance(value, (int, float)):
            display_value = f"{value:,.2f}"
        else:
            display_value = str(value)
            
        # Add the Key (bold) and Value (normal text)
        pdf.set_font("Arial", style='B') # Bold for the key
        pdf.cell(70, 10, txt=f"{key}:", border=0, ln=False) # Key takes up 70 units width, doesn't break line
        
        pdf.set_font("Arial", style='') # Normal for the value
        pdf.cell(130, 10, txt=display_value, border=0, ln=True) # Value takes the rest of the width, breaks line

    # Output the PDF as a byte string in memory
    pdf_output = pdf.output(dest="S")
    return pdf_output.encode('latin-1') # Ensure proper encoding for Streamlit download