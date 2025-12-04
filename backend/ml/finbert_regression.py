from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import pipeline
from typing import List, Dict

# Load English FinBERT Regressor model
tokenizer_en = AutoTokenizer.from_pretrained("LHF/finbert-regressor")
finbert_en = AutoModelForSequenceClassification.from_pretrained("LHF/finbert-regressor")
nlp_en = pipeline("sentiment-analysis", model=finbert_en, tokenizer=tokenizer_en)

# Load German FinBERT model (classification-based, no regression model available)
tokenizer_de = AutoTokenizer.from_pretrained("scherrmann/GermanFinBert_SC_Sentiment")
finbert_de = AutoModelForSequenceClassification.from_pretrained("scherrmann/GermanFinBert_SC_Sentiment")
nlp_de = pipeline("sentiment-analysis", model=finbert_de, tokenizer=tokenizer_de)


def analyze_sentiment_regression(sentences: List[str], language: str = "en") -> List[Dict]:
    """
    Analyze sentiment of financial text using FinBERT.
    
    Args:
        sentences: List of sentences to analyze
        language: "en" for English or "de" for German
        
    Returns:
        List of dictionaries with sentiment labels and scores
        
    Note:
        - English model (LHF/finbert-regressor): Regression-based sentiment scores
        - German model (scherrmann/GermanFinBert_SC_Sentiment): Classification-based
          LABEL_0: negative, LABEL_1: neutral, LABEL_2: positive
    """
    if language.lower() == "de":
        return nlp_de(sentences)
    elif language.lower() == "en":
        return nlp_en(sentences)
    else:
        raise ValueError(f"Unsupported language: {language}. Use 'en' or 'de'.")


if __name__ == "__main__":
    # Test English sentences
    english_sentences = ["there is a shortage of capital, and we need extra financing",
                        "growth is strong and we have plenty of liquidity",
                        "there are doubts about our finances",
                        "profits are flat"]
    
    print("=== English Sentiment Analysis (Regression) ===")
    english_results = analyze_sentiment_regression(english_sentences, language="en")
    print(english_results)
    
    # Test German sentences
    german_sentences = [
        "Es gibt einen Mangel an Kapital und wir benötigen zusätzliche Finanzierung.",
        "Das Wachstum ist stark und wir haben reichlich Liquidität.",
        "Es gibt Zweifel an unseren Finanzen.",
        "Die Gewinne sind konstant."
    ]
    
    print("\n=== German Sentiment Analysis ===")
    german_results = analyze_sentiment_regression(german_sentences, language="de")
    print(german_results)  