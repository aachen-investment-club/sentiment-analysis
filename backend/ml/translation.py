from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from typing import List
import torch
from preprocessing import preprocess_pdf

# Model and tokenizer - loaded once at module import (following sentiment_analysis.py pattern)
_MODEL_NAME = "Helsinki-NLP/opus-mt-de-en"
_TOKENIZER = AutoTokenizer.from_pretrained(_MODEL_NAME)
_MODEL = AutoModelForSeq2SeqLM.from_pretrained(_MODEL_NAME)

# Set model to evaluation mode for inference (faster, uses less memory)
_MODEL.eval()

# Move to GPU if available, otherwise CPU
device = "cuda" if torch.cuda.is_available() else "cpu"
_MODEL.to(device)

def translate_to_english(german_texts: List[str]) -> List[str]:
    """
    Translate German text to English using Helsinki-NLP translation model.
    
    Args:
        german_texts: List of German text strings to translate
        
    Returns:
        List of translated English text strings
    """
    if not german_texts:
        return []
    
    # Tokenize all texts
    inputs = _TOKENIZER(german_texts, return_tensors="pt", padding=True, truncation=True, max_length=512)
    
    # Move inputs to same device as model
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    # Generate translations
    with torch.no_grad():  # Disable gradient computation for inference (faster, less memory)
        outputs = _MODEL.generate(**inputs, max_length=512, num_beams=4, early_stopping=True)
    
    # Decode translations
    translations = _TOKENIZER.batch_decode(outputs, skip_special_tokens=True)
    
    return translations

if __name__ == "__main__":
    sentences = translate_to_english(preprocess_pdf("../../example_articles/bitcoin_article.pdf"))
    print(sentences)