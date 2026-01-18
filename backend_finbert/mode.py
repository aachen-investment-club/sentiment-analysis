import os
import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer


class GermanRegressionFinBERTDistil(nn.Module):
    def __init__(self, base_model_path, dropout=0.1, freeze_bert=True):
        super().__init__()
        self.bert = AutoModel.from_pretrained(base_model_path)

        self.drop = nn.Dropout(p=dropout)
        self.out = nn.Linear(self.bert.config.hidden_size, 1)

        if freeze_bert:
            for p in self.bert.parameters():
                p.requires_grad = False

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled = outputs.last_hidden_state[:, 0]      # CLS for DistilBERT
        return self.out(self.drop(pooled))            # (batch, 1)


def inference():
    ckpt_path = "../regression_finance_finetune_gbert_distil/pytorch_model.bin"
    state = torch.load(ckpt_path, map_location="cpu")

    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]

    base_sd = {}
    head_sd = {}

    for k, v in state.items():
        if k.startswith("bert."):
            base_sd[k.replace("bert.", "", 1)] = v
        elif k.startswith("out."):
            head_sd[k.replace("out.", "", 1)] = v

    # Use the SAME base you trained with (recommended)
    base_model_path = "../distilbert-german-finance-mlm"
    model = GermanRegressionFinBERTDistil(base_model_path=base_model_path)

    model.bert.load_state_dict(base_sd, strict=True)

    # If you *didn't* save head weights, head_sd might be empty
    if head_sd:
        model.out.load_state_dict(head_sd, strict=True)

    model.eval()

    tokenizer = AutoTokenizer.from_pretrained(
        "BenjaminOyarzun17/Finance-Finetune-distil-GBert-Finetune-Regression",
        use_fast=True
    )

    text = "Das Unternehmen meldete einen erwarteten Gewinnanstieg."
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)

    with torch.no_grad():
        pred = model(inputs["input_ids"], inputs["attention_mask"]).squeeze().item()

    print("prediction:", pred)


if __name__ == "__main__":
    inference()
