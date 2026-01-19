from typing import List, Tuple
from pathlib import Path
from collections import defaultdict
import re # For regular expressions
import nltk
from dotenv import load_dotenv
import os

load_dotenv()


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




