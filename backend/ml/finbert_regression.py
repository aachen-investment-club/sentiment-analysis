# Load model directly
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import pipeline

tokenizer = AutoTokenizer.from_pretrained("LHF/finbert-regressor")
finbert_R = AutoModelForSequenceClassification.from_pretrained("LHF/finbert-regressor")


nlp = pipeline("sentiment-analysis", model=finbert_R, tokenizer=tokenizer)

sentences = ["there is a shortage of capital, and we need extra financing",
             "growth is strong and we have plenty of liquidity",
             "there are doubts about our finances",
             "profits are flat"]

results = nlp(sentences)
print(results)  