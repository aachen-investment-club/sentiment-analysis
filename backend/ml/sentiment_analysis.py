import sys
from pathlib import Path

_script_path = Path(__file__).resolve()
_project_root = _script_path.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from backend.ml.preprocessing import preprocess_text
from collections import defaultdict
import spacy
import requests
from dotenv import load_dotenv
import os

load_dotenv()





BACKEND2_URL = os.environ.get("FINBERT_URL")
print(BACKEND2_URL)

def analyze_sentiment_regression_via_backend2(
    sentences: list[str],
    german: bool = False, 
    timeout_s: float = 30.0
) -> list[dict]:
    if german: 
        language = "de"
    else: 
        language = "en"
    payload = {
        "sentences": sentences,
        "language": language,
    }

    response = requests.post(
        f"{BACKEND2_URL}/predict",
        json=payload,
        timeout=timeout_s,
    )

    response.raise_for_status()
    data = response.json()

    if "results" not in data or not isinstance(data["results"], list):
        raise RuntimeError(f"Invalid response from backend2: {data}")

    # Coerce types defensively
    return [
        {
            "score": float(item["score"]),
            "sentence": str(item["sentence"]),
        }
        for item in data["results"]
    ]


def sentiment_analysis_text(
    text: str,
    german: bool,
    regression: bool = False,
    normalize: bool = False,
):
    preprocessed_sentences = preprocess_text(text)


    results = analyze_sentiment_regression_via_backend2(
        preprocessed_sentences,
        german  
    )

    average, overall_sentiment, confidence = aggregate_sentiment_regression(results)

    return average, overall_sentiment, confidence, results


     
def aggregate_sentiment(sentence_sentiment: list[dict]) -> tuple[str, float]:
    """
    Aggregate classification-based sentiment results.
    Uses a hybrid approach: counts sentences by label and weights by confidence.
    
    Args:
        sentence_sentiment: list of dicts like [{'label': 'Positive', 'score': 0.86}, ...]
        
    Returns:
        Tuple of (overall_sentiment_label, confidence_percentage)
    """
    if not sentence_sentiment:
        return "NEUTRAL", 0.0
    
    # Count sentences by label (simple majority)
    label_counts = defaultdict(int)
    label_weighted_scores = defaultdict(float)
    
    for pred in sentence_sentiment:
        label = pred['label']
        score = pred['score']
        label_counts[label] += 1
        label_weighted_scores[label] += score
    
    # Calculate weighted average confidence per label
    label_avg_confidence = {}
    for label in label_counts:
        label_avg_confidence[label] = label_weighted_scores[label] / label_counts[label]
    
    # Use majority vote, but break ties with weighted confidence
    # This prevents neutral from dominating when there are clear negative/positive signals
    max_count = max(label_counts.values())
    labels_with_max_count = [label for label, count in label_counts.items() if count == max_count]
    
    if len(labels_with_max_count) == 1:
        # Clear majority
        max_label = labels_with_max_count[0]
        confidence = round(label_avg_confidence[max_label] * 100, 1)
    else:
        # Tie - use highest weighted confidence
        max_label = max(labels_with_max_count, key=lambda l: label_avg_confidence[l])
        confidence = round(label_avg_confidence[max_label] * 100, 1)
    
    # Special handling: if negative and positive are both significant, 
    # and neutral is just slightly ahead, consider the stronger signal
    if max_label == "Neutral" and len(sentence_sentiment) > 5:
        negative_pct = label_counts.get("Negative", 0) / len(sentence_sentiment)
        positive_pct = label_counts.get("Positive", 0) / len(sentence_sentiment)
        
        # If negative or positive has >30% and neutral is <75%, use the stronger signal
        if negative_pct > 0.3 and negative_pct > positive_pct and label_counts["Neutral"] / len(sentence_sentiment) < 0.75:
            max_label = "Negative"
            confidence = round(label_avg_confidence.get("Negative", 0.5) * 100, 1)
        elif positive_pct > 0.3 and positive_pct > negative_pct and label_counts["Neutral"] / len(sentence_sentiment) < 0.75:
            max_label = "Positive"
            confidence = round(label_avg_confidence.get("Positive", 0.5) * 100, 1)
    
    return max_label, confidence


# High-impact financial keywords that indicate importance
# Only sentiment-carrying keywords (positive or negative) are included
# Neutral financial terms are excluded to avoid weighting non-sentiment sentences

FINANCIAL_KEYWORDS = [
    # Positive
    "growth", "gain", "increase", "rise", "rebound",
    "rally", "recovery", "expansion", "improve",
    "buy", "purchase", "accumulate", "demand", "support",
    "profit", "earnings", "revenue", "cashflow", "margin",
    "confidence", "optimism", "adoption", "upgrade", "commitment",

    # Negative
    "decline", "fall", "drop", "slump", "crash",
    "plunge", "plummet", "selloff",
    "loss", "deficit", "erosion", "weakness", "pressure",
    "sell", "dump", "risk", "fear", "uncertainty", "volatility",
    "bankruptcy", "default", "restructure", "layoff", "downsizing",
    "recession", "inflation", "tightening", "crackdown", "sanction"
]


# Convert list to set for efficient lookup and to ensure uniqueness
FINANCIAL_KEYWORDS = set(FINANCIAL_KEYWORDS)

# Lazy loading of spaCy model for lemmatization
_nlp = None

def _get_spacy_model():
    """Lazy load spaCy model for lemmatization."""
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])
        except OSError:
            raise OSError(
                "spaCy English model 'en_core_web_sm' not found. "
                "Install it with: python -m spacy download en_core_web_sm"
            )
    return _nlp


def count_financial_keywords(sentence: str, keywords: set[str] = FINANCIAL_KEYWORDS) -> int:
    """
    Count the number of high-impact financial keywords in a sentence.
    Uses spaCy lemmatization to match keywords (which are already lemmatized).
    
    Args:
        sentence: The sentence text to analyze
        keywords: Set of lemmatized keywords to search for (case-insensitive)
        
    Returns:
        Count of keyword matches
    """
    # Load spaCy model and process sentence
    nlp = _get_spacy_model()
    doc = nlp(sentence.lower())
    
    # Extract lemmatized words from the sentence
    lemmatized_words = {token.lemma_.lower() for token in doc if not token.is_punct and not token.is_space}
    
    # Count how many keywords match the lemmatized words
    return sum(1 for keyword in keywords if keyword.lower() in lemmatized_words)


def aggregate_sentiment_regression(
    sentence_sentiment: list[dict],
    positive_threshold: float = 0.05,
    negative_threshold: float = -0.05,
    lead_weight: float = 1.5,
    lead_sentences: int = 2,
    keyword_weight_per_hit: float = 1.2,
    financial_keywords: set[str] = FINANCIAL_KEYWORDS,
    enable_logging: bool = False
) -> tuple[str, float]:
    """
    Aggregate regression-based sentiment results using weighted averaging.
    
    This function computes a final article-level sentiment score from sentence-level
    regression scores using configurable weighting strategies:
    - Lead importance: First N sentences receive higher weight
    - Keyword importance: Sentences with financial keywords receive additional weight
    
    Args:
        sentence_sentiment: List of dicts like [{'score': 0.65, 'sentence': 'text'}, ...]
                           Note: 'sentence' key is optional, used only for keyword weighting
        positive_threshold: Score above this is considered positive (default: 0.05)
        negative_threshold: Score below this is considered negative (default: -0.05)
        lead_weight: Multiplier for first N sentences (default: 1.5)
        lead_sentences: Number of leading sentences to weight (default: 2)
        keyword_weight_per_hit: Weight multiplier per keyword match (default: 1.2)
        financial_keywords: Set of keywords to search for (default: FINANCIAL_KEYWORDS)
        enable_logging: If True, print detailed weight and contribution information
        
    Returns:
        Tuple of (overall_sentiment_label, confidence)
        - sentiment_label: "POSITIVE", "NEGATIVE", or "NEUTRAL"
        - confidence: Confidence score (0-100) based on absolute value of weighted score
    """
    if not sentence_sentiment:
        return "NEUTRAL", 0.0
    
    n = len(sentence_sentiment)
    weighted_scores = []
    total_weight = 0.0
    
    if enable_logging:
        print("\n" + "=" * 80)
        print("WEIGHTED SENTIMENT AGGREGATION")
        print("=" * 80)
        print(f"Total sentences: {n}")
        print(f"Lead weight: {lead_weight}x (first {lead_sentences} sentences)")
        print(f"Keyword weight: {keyword_weight_per_hit}x per keyword hit")
        print("-" * 80)
    
    for i, pred in enumerate(sentence_sentiment):
        score = pred['score']
        base_weight = 1.0
        
        # Apply lead sentence weighting
        if i < lead_sentences:
            base_weight *= lead_weight
            lead_boost = True
        else:
            lead_boost = False
        
        # Apply keyword weighting (if sentence text is available)
        keyword_count = 0
        if 'sentence' in pred:
            keyword_count = count_financial_keywords(pred['sentence'], financial_keywords)
            if keyword_count > 0:
                # Apply compound weight: 1.2^n for n keyword hits
                keyword_multiplier = keyword_weight_per_hit ** keyword_count
                base_weight *= keyword_multiplier
        
        # Calculate weighted contribution
        weighted_score = score * base_weight
        weighted_scores.append(weighted_score)
        total_weight += base_weight
        
        # Optional logging
        if enable_logging:
            flags = []
            if lead_boost:
                flags.append(f"LEAD x{lead_weight}")
            if keyword_count > 0:
                flags.append(f"KEYWORDS({keyword_count}) x{keyword_weight_per_hit**keyword_count:.2f}")
            flag_str = " | ".join(flags) if flags else "BASE"
            
            print(f"Sentence {i+1:3d}: score={score:+.4f}, weight={base_weight:.2f}, "
                  f"contribution={weighted_score:+.4f} [{flag_str}]")
    
    # Compute weighted average
    if total_weight == 0:
        weighted_avg = 0.0
    else:
        weighted_avg = sum(weighted_scores) / total_weight
    
    # Clamp to [-1, 1] range (should not exceed, but for safety)
    weighted_avg = max(-1.0, min(1.0, weighted_avg))
    
    # Determine sentiment label based on thresholds
    if weighted_avg > positive_threshold:
        sentiment_label = "POSITIVE"
    elif weighted_avg < negative_threshold:
        sentiment_label = "NEGATIVE"
    else:
        sentiment_label = "NEUTRAL"
    
    # Calculate confidence as percentage (0-100)
    # Use absolute value and scale to percentage
    confidence = round(abs(weighted_avg) * 100, 1)
    
    if enable_logging:
        print("-" * 80)
        print(f"Total weight sum: {total_weight:.2f}")
        print(f"Weighted average: {weighted_avg:+.4f}")
        print(f"Sentiment label: {sentiment_label}")
        print(f"Confidence: {confidence}%")
        print("=" * 80 + "\n")
    
    return weighted_avg, sentiment_label, confidence


