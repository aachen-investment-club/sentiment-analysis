import streamlit as st
import pandas as pd
from transformers import BertTokenizer, BertForSequenceClassification, pipeline
from collections import defaultdict

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







_MODEL_NAME = "yiyanghkust/finbert-tone"
_FINBERT = BertForSequenceClassification.from_pretrained(_MODEL_NAME, num_labels=3)
_TOKENIZER = BertTokenizer.from_pretrained(_MODEL_NAME)
_PIPELINE = pipeline("sentiment-analysis", model=_FINBERT, tokenizer=_TOKENIZER)


def sentiment_analysis(text: str) -> tuple[str, float, list[dict]]:
    preprocessed_text = preprocess_text(text)
    results = _PIPELINE(preprocessed_text)
    overall_sentiment, confidence = aggregate_sentiment(results)
    return overall_sentiment, confidence, results

def aggregate_sentiment(sentence_sentiment: list[dict]) -> dict:
    """
    sentence_preds: list of dicts like [{'label': 'Positive', 'score': 0.86}, ...]
    returns: overall sentiment and approximate confidence
    """
    label_count = defaultdict(float)

    # Count scores by label
    for pred in sentence_sentiment:
        label_count[pred['label']] += pred['score']

    # Normalize scores to get percentages
    sum_scores = sum(label_count.values())
    
    for label in label_count:
        label_count[label] /= sum_scores

    # Get highest score
    max_score = max(label_count.values())
    max_label = max(label_count, key=label_count.get)

    # Calculate confidence
    confidence = round(max_score * 100, 1)

    return max_label, confidence









st.header("hellow world")



df = pd.DataFrame({
  'first column': [1, 2, 3, 4],
  'second column': [10, 20, 30, 40]
})
inp = st.text_input("input something")



st.write(inp)



#"There is a shortage of capital, and we need extra financing. The future growth is strong and we have plenty of liquidity":

st.write(sentiment_analysis(inp))





st.write(df)

