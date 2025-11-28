from preprocessing import preprocess_text
from transformers import BertTokenizer, BertForSequenceClassification, pipeline

_MODEL_NAME = "yiyanghkust/finbert-tone"
_FINBERT = BertForSequenceClassification.from_pretrained(_MODEL_NAME, num_labels=3)
_TOKENIZER = BertTokenizer.from_pretrained(_MODEL_NAME)
_PIPELINE = pipeline("sentiment-analysis", model=_FINBERT, tokenizer=_TOKENIZER)


def sentiment_analysis(text: str) -> list[dict]:
    preprocessed_text = preprocess_text(text)
    results = _PIPELINE(preprocessed_text)
    return results

print(sentiment_analysis("There is a shortage of capital, and we need extra financing. The future growth is strong and we have plenty of liquidity"))