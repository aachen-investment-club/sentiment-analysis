from preprocessing import preprocess_text
from transformers import BertTokenizer, BertForSequenceClassification, pipeline
from collections import defaultdict

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

print(sentiment_analysis("There is a shortage of capital, and we need extra financing. The future growth is strong and we have plenty of liquidity"))