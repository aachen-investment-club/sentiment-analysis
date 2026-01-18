import os
from typing import Dict, List, Tuple

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


def load_en_from_env():
    model_id = os.getenv("EN_MODEL_ID", "LHF/finbert-regressor")
    torch_num_threads = int(os.getenv("TORCH_NUM_THREADS", "1"))
    torch.set_num_threads(torch_num_threads)

    tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=True)
    model = AutoModelForSequenceClassification.from_pretrained(model_id)
    model.eval()
    return model, tokenizer


@torch.no_grad()
def predict_en(model, tokenizer, text: str, normalize: bool = False) -> float:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    score = model(**inputs).logits.squeeze().item()

    if normalize:
        score *= 1.4

    score = max(-1.0, min(1.0, float(score)))
    return score


@torch.no_grad()
def analyze_sentiment_regression_en(
    model,
    tokenizer,
    sentences: List[str],
    normalize: bool = False,
    max_length: int = 512,
) -> List[Dict]:
    if not sentences:
        return []

    inputs = tokenizer(
        sentences,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=max_length,
    )

    scores = model(**inputs).logits.squeeze(-1).tolist()  # List[float]

    if normalize:
        scores = [s * 1.4 for s in scores]

    scores = [max(-1.0, min(1.0, float(s))) for s in scores]

    return [{"score": s, "sentence": sent} for s, sent in zip(scores, sentences)]
