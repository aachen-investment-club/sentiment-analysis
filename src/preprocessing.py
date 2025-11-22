from typing import List
import nltk
def preprocess_text(raw_text:str) -> List[str]:
    """
    Take raw text and return a list of cleaned sentences/chunks ready for sentiment analysis.
    Performs basic cleaning and sentence splitting.
    """
    nltk.download('punkt')
    nltk.download('punkt_tab')

    return nltk.sent_tokenize(raw_text) 

def preprocess_pdf(pdf_path:str) -> List[str]:
    """
    Extract text from PDF bytes and return a list of cleaned sentences/chunks.
    Internally calls preprocess_text() on the extracted text.
    """
    return 

print(preprocess_text("This is a test sentence. This is another test sentence."))