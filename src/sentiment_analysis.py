from preprocessing import preprocess_text

from transformers import BertTokenizer, BertForSequenceClassification
from transformers import pipeline


def sentiment_analysis(text:str) -> list[dict]:
    
    finbert = BertForSequenceClassification.from_pretrained('yiyanghkust/finbert-tone', num_labels=3)
    tokenizer = BertTokenizer.from_pretrained('yiyanghkust/finbert-tone')

    nlp = pipeline("sentiment-analysis", model=finbert, tokenizer=tokenizer)
    preprocessed_text = preprocess_text(text)
    results = nlp(preprocessed_text)
    return results

print(sentiment_analysis("There is a shortage of capital, and we need extra financing. The future growth is strong and we have plenty of liquidity"))