import os
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer


class GermanRegressionFinBERTDistil(nn.Module):
    def __init__(self, base_model_path: str, dropout: float = 0.1, freeze_bert: bool = True):
        super().__init__()
        self.bert = AutoModel.from_pretrained(base_model_path)
        self.drop = nn.Dropout(p=dropout)
        self.out = nn.Linear(self.bert.config.hidden_size, 1)

        if freeze_bert:
            for p in self.bert.parameters():
                p.requires_grad = False

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled = outputs.last_hidden_state[:, 0]  
        return self.out(self.drop(pooled))        


def _split_state_dict(state: dict) -> Tuple[dict, dict]:
    base_sd, head_sd = {}, {}
    for k, v in state.items():
        if k.startswith("bert."):
            base_sd[k.replace("bert.", "", 1)] = v
        elif k.startswith("out."):
            head_sd[k.replace("out.", "", 1)] = v
    return base_sd, head_sd


def load_checkpoint_into_model(model: GermanRegressionFinBERTDistil, ckpt_path: str) -> None:
    
    state = torch.load(ckpt_path, map_location="cpu")

    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]

    base_sd, head_sd = _split_state_dict(state)
    model.bert.load_state_dict(base_sd, strict=True)
    if head_sd:
        model.out.load_state_dict(head_sd, strict=True)


def load_de_from_env():
    base_model_path = os.getenv("DE_BASE_MODEL_PATH", "./backend_finbert/distilbert-german-finance-mlm")
    ckpt_path = os.getenv("DE_CKPT_PATH", "./backend_finbert/regression_finance_finetune_gbert_distil/pytorch_model.bin")
    tokenizer_id = os.getenv(
        "DE_TOKENIZER_ID",
        "BenjaminOyarzun17/Finance-Finetune-distil-GBert-Finetune-Regression",
    )
    torch_num_threads = int(os.getenv("TORCH_NUM_THREADS", "1"))
    torch.set_num_threads(torch_num_threads)

    tokenizer = AutoTokenizer.from_pretrained(tokenizer_id, use_fast=True)

    model = GermanRegressionFinBERTDistil(base_model_path=base_model_path, freeze_bert=True)
    load_checkpoint_into_model(model, ckpt_path)
    model.eval()

    return model, tokenizer


@torch.no_grad()
def predict_de(model: GermanRegressionFinBERTDistil, tokenizer, text: str) -> float:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    pred = model(inputs["input_ids"], inputs["attention_mask"]).squeeze().item()
    return float(pred)


@torch.no_grad()
def analyze_sentiment_regression_de(
    model: GermanRegressionFinBERTDistil,
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

    logits = model(inputs["input_ids"], inputs["attention_mask"])  
    scores = logits.squeeze(-1).tolist()  

    if normalize:
        scores = [score * 1.4 for score in scores]

    scores = [max(-1.0, min(1.0, float(score))) for score in scores]

    return [{"score": s, "sentence": sent} for s, sent in zip(scores, sentences)]
