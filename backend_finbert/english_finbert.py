import os
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from huggingface_hub import snapshot_download


load_dotenv()


class EnglishRegressionFinBERTDistil(nn.Module):
    def __init__(
        self,
        base_model_path: str,
        dropout: float = 0.1,
        freeze_bert: bool = True,
    ):
        super().__init__()
        self.bert = AutoModel.from_pretrained(base_model_path)
        self.drop = nn.Dropout(p=dropout)
        self.out = nn.Linear(self.bert.config.hidden_size, 1)

        if freeze_bert:
            for p in self.bert.parameters():
                p.requires_grad = False

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled = outputs.last_hidden_state[:, 0]  # [CLS]
        return self.out(self.drop(pooled))

    def unfreeze_bert_layers(self, num_layers: int) -> None:
        total_layers = 6
        num_layers = max(0, min(num_layers, total_layers))

        for p in self.bert.parameters():
            p.requires_grad = False

        start = total_layers - num_layers
        for i in range(start, total_layers):
            for p in self.bert.transformer.layer[i].parameters():
                p.requires_grad = True




def ensure_en_hf_assets_local(
    *,
    force_download: bool = False,
) -> str:
    repo_id = os.getenv("EN_HF_REPO_ID", "").strip()
    revision = os.getenv("EN_HF_REVISION", "main").strip() or None
    token = os.getenv("HF_TOKEN", "").strip() or None

    local_dir = os.getenv("EN_LOCAL_DIR", "")
    local_dir_path = Path(local_dir)
    local_dir_path.mkdir(parents=True, exist_ok=True)

    if not repo_id:
        return str(local_dir_path)

    needs_download = force_download
    if not needs_download:
        key_candidates = [
            local_dir_path / "config.json",
            local_dir_path / "tokenizer.json",
            local_dir_path / "tokenizer_config.json",
            local_dir_path / "vocab.txt",
            local_dir_path / "special_tokens_map.json",
            local_dir_path / "pytorch_model.bin",
        ]
        needs_download = not any(p.exists() for p in key_candidates)

    if needs_download:
        snapshot_download(
            repo_id=repo_id,
            revision=revision,
            token=token,
            local_dir=str(local_dir_path),
            local_dir_use_symlinks=False,  
            force_download=force_download
        )

    return str(local_dir_path)






def _split_state_dict(state: dict) -> Tuple[dict, dict]:
    base_sd, head_sd = {}, {}
    for k, v in state.items():
        if k.startswith("bert."):
            base_sd[k.replace("bert.", "", 1)] = v
        elif k.startswith("out."):
            head_sd[k.replace("out.", "", 1)] = v
    return base_sd, head_sd


def load_checkpoint_into_model(model: EnglishRegressionFinBERTDistil, ckpt_path: str) -> None:
    state = torch.load(ckpt_path, map_location="cpu")

    if isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]

    base_sd, head_sd = _split_state_dict(state)

    if base_sd:
        model.bert.load_state_dict(base_sd, strict=True)

    if head_sd:
        model.out.load_state_dict(head_sd, strict=True)



def load_en_from_env():
    local_dir = ensure_en_hf_assets_local()

    base_model_path = os.getenv("EN_BASE_MODEL_PATH", "distilbert/distilbert-base-uncased")
    ckpt_path = os.getenv("EN_CKPT_PATH", os.path.join(local_dir, "pytorch_model.bin"))
    tokenizer_id = os.getenv("EN_TOKENIZER_ID", local_dir)

    torch_num_threads = int(os.getenv("TORCH_NUM_THREADS", "1"))
    torch.set_num_threads(torch_num_threads)

    tokenizer = AutoTokenizer.from_pretrained(tokenizer_id, use_fast=True)

    model = EnglishRegressionFinBERTDistil(base_model_path=base_model_path, freeze_bert=True)
    load_checkpoint_into_model(model, ckpt_path)
    model.eval()

    return model, tokenizer

@torch.no_grad()
def predict_en(model: EnglishRegressionFinBERTDistil, tokenizer, text: str, normalize: bool = False) -> float:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    score = model(inputs["input_ids"], inputs["attention_mask"]).squeeze().item()

    if normalize:
        score *= 1.4

    score = max(-1.0, min(1.0, float(score)))
    return score


@torch.no_grad()
def analyze_sentiment_regression_en(
    model: EnglishRegressionFinBERTDistil,
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

    logits = model(inputs["input_ids"], inputs["attention_mask"])  # [batch, 1]
    scores = logits.squeeze(-1).tolist()  # List[float]

    if normalize:
        scores = [s * 1.4 for s in scores]

    scores = [min(1, max(-1, s)) for s in scores]

    return [{"score": s, "sentence": sent} for s, sent in zip(scores, sentences)]
