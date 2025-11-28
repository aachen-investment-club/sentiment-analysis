from typing import List
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

def preprocess_pdf(pdf_path:str) -> List[str]:
    """
    Extract text from PDF bytes and return a list of cleaned sentences/chunks.
    Internally calls preprocess_text() on the extracted text.
    """
    return 
