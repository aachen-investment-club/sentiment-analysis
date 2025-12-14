from backend.ml.preprocessing import preprocess_text, preprocess_pdf
from backend.ml.translation import translate_to_english
from transformers import BertTokenizer, BertForSequenceClassification, pipeline
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from collections import defaultdict

_MODEL_NAME = "yiyanghkust/finbert-tone"
_FINBERT_C = BertForSequenceClassification.from_pretrained(_MODEL_NAME, num_labels=3)
_TOKENIZER_C = BertTokenizer.from_pretrained(_MODEL_NAME)

_TOKENIZER_R = AutoTokenizer.from_pretrained("LHF/finbert-regressor")
_FINBERT_R= AutoModelForSequenceClassification.from_pretrained("LHF/finbert-regressor")

_FINBERT_DE = AutoModelForSequenceClassification.from_pretrained('scherrmann/GermanFinBert_SC_Sentiment')
_TOKENIZER_DE = AutoTokenizer.from_pretrained('scherrmann/GermanFinBert_SC_Sentiment')

_PIPELINE = pipeline("sentiment-analysis", model=_FINBERT_R, tokenizer=_TOKENIZER_R)

def sentiment_analysis_text(text: str, german: bool, regression: bool = False) -> tuple[str, float, list[dict]]:
    preprocessed_text = preprocess_text(text)
    if regression: 
        _PIPELINE.model = _FINBERT_R
        _PIPELINE.tokenizer = _TOKENIZER_R
    else: 
        if german:
            # Translate German to English, then use English FinBERT model
            preprocessed_text = translate_to_english(preprocessed_text)
            _PIPELINE.model = _FINBERT_C
            _PIPELINE.tokenizer = _TOKENIZER_C
        else:
            _PIPELINE.model = _FINBERT_C
            _PIPELINE.tokenizer = _TOKENIZER_C
        
    results = _PIPELINE(preprocessed_text)
    overall_sentiment, confidence = aggregate_sentiment(results)
    most_relevant_phrase = get_most_relevat_phrase(preprocessed_text, results)
    return overall_sentiment, confidence, results

def sentiment_analysis_pdf(pdf_url: str, german: bool, regression: bool = False) -> tuple[str, float, list[dict]]:
    preprocessed_text = preprocess_pdf(pdf_url)
    if regression: 
        _PIPELINE.model = _FINBERT_R
        _PIPELINE.tokenizer = _TOKENIZER_R
    else: 
        if german:
            # Translate German to English, then use English FinBERT model
            preprocessed_text = translate_to_english(preprocessed_text)
            _PIPELINE.model = _FINBERT_C
            _PIPELINE.tokenizer = _TOKENIZER_C
        else:
            _PIPELINE.model = _FINBERT_C
            _PIPELINE.tokenizer = _TOKENIZER_C

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


def get_most_relevat_phrase(sentences: list[str], sentence_sentiment: list[dict]) -> tuple[str, float, str]:

    most_relevant_phrase = ""
    max_impact_score = -1.0
    sentiment = ""

    for i, pred in sentence_sentiment:
        if pred['score'] > max_impact_score:
                max_impact_score = pred['score']
                most_relevant_phrase = sentences[i]
                sentiment = pred['label']
    
    return most_relevant_phrase, max_impact_score, sentiment