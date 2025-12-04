from typing import List
from pathlib import Path
import fitz  # PyMuPDF for text extraction
import pdfplumber  # For table extraction and complex layouts
import nltk


for resource in ("punkt", "punkt_tab"):
    try:
        nltk.data.find(f"tokenizers/{resource}")
    except LookupError:
        nltk.download(resource)

def preprocess_text(raw_text:str) -> List[str]:
    """
    Take raw text and return a list of cleaned sentences/chunks ready for sentiment analysis.
    Performs basic cleaning and sentence splitting.
    """
    return nltk.sent_tokenize(raw_text) 

def preprocess_pdf(pdf_path: str) -> List[str]:
    """
    Extract text from PDF bytes and return a list of cleaned sentences/chunks.
    Internally calls preprocess_text() on the extracted text.
    
    Args:
        pdf_path: Path to the PDF file (can be relative or absolute)
    """
    # Convert to Path object for better path handling
    pdf_path = Path(pdf_path)
    
    # Open PDF and extract text
    doc = fitz.open(str(pdf_path))
    text = ""
    for page in doc:
        text += page.get_text("text") + "\n"
    doc.close()
    return preprocess_text(text)


if __name__ == "__main__":
    print(preprocess_pdf("../../example_articles/bitcoin_article.pdf"))