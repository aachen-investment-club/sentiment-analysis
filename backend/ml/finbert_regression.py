from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import List, Dict
import torch

# Load FinBERT Regressor model
tokenizer = AutoTokenizer.from_pretrained("LHF/finbert-regressor")
finbert = AutoModelForSequenceClassification.from_pretrained("LHF/finbert-regressor")
finbert.eval()  # Set to evaluation mode

def analyze_sentiment_regression(sentences: List[str], normalize: bool = False) -> List[Dict]:
    """
    Analyze sentiment of financial text using FinBERT regression model.
    
    Args:
        sentences: List of sentences to analyze
        normalize: If True, normalize scores to better use the [-1, 1] range
        
    Returns:
        List of dictionaries with sentiment scores: [{'score': float, 'sentence': str}, ...]
        Scores are in range [-1, 1] where -1 is negative, 1 is positive
        
    Note:
        Uses LHF/finbert-regressor: Regression-based sentiment scores
        The model typically outputs in a conservative range (~-0.7 to 0.7)
        Set normalize=True to scale outputs to better utilize the full [-1, 1] range
    """
    # For regression model, use the model directly instead of pipeline
    # The pipeline("sentiment-analysis") is designed for classification and
    # incorrectly wraps regression outputs with labels
    results = []
    
    # Process all sentences in a single batch for efficiency
    inputs = tokenizer(sentences, return_tensors="pt", truncation=True, 
                      max_length=512, padding=True)
    
    # Get model predictions
    with torch.no_grad():
        outputs = finbert(**inputs)
        # Extract regression scores (logits shape is [batch_size, 1] for regression)
        scores = outputs.logits[:, 0].tolist()
    
    # Optional normalization to better utilize the [-1, 1] range
    # Based on observed model behavior, it typically outputs in [-0.7, 0.7]
    if normalize:
        scores = [max(-1.0, min(1.0, score * 1.4)) for score in scores]
    else:
        scores = [max(-1.0, min(1.0, score)) for score in scores]
    
    # Include both score and original sentence text for weighted aggregation
    results = [{"score": score, "sentence": sentence} for score, sentence in zip(scores, sentences)]
    return results


if __name__ == "__main__":
    # Test English sentences - examples demonstrating low to high financial sentiment
    english_sentences = [
        # Very negative (low sentiment) - financial distress
        "The company is facing bankruptcy and massive losses",
        "We are experiencing severe financial crisis and cannot meet our obligations",
        # Negative sentiment
        "There is a shortage of capital, and we need extra financing",
        "There are serious doubts about our financial stability",
        # Neutral/flat sentiment
        "Profits are flat and revenue remains unchanged",
        # Positive sentiment
        "Growth is strong and we have plenty of liquidity",
        "The company reported solid earnings and increased market share",
        # Very positive (high sentiment) - excellent performance
        "Record-breaking profits and exceptional financial performance this quarter",
        "Outstanding revenue growth and strong cash flow position exceeded all expectations"
    ]
    
    print("=== English Sentiment Analysis (Regression) ===")
    print("\n--- Without Normalization ---")
    english_results = analyze_sentiment_regression(english_sentences, normalize=False)
    for i, (sentence, result) in enumerate(zip(english_sentences, english_results)):
        sentiment_label = "POSITIVE" if result['score'] > 0.1 else ("NEGATIVE" if result['score'] < -0.1 else "NEUTRAL")
        print(f"{i+1}. [{sentiment_label:8}] {result['score']:+.4f} | {sentence[:70]}")
    
    print("\n--- With Normalization (1.4x scaling) ---")
    english_results_norm = analyze_sentiment_regression(english_sentences, normalize=True)
    for i, (sentence, result) in enumerate(zip(english_sentences, english_results_norm)):
        sentiment_label = "POSITIVE" if result['score'] > 0.1 else ("NEGATIVE" if result['score'] < -0.1 else "NEUTRAL")
        print(f"{i+1}. [{sentiment_label:8}] {result['score']:+.4f} | {sentence[:70]}")