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

from pathlib import Path

#load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=False)


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




def _ensure_hf_repo_local(
    *,
    repo_id: Optional[str],
    local_dir: str,
    revision: Optional[str] = None,
    token: Optional[str] = None,
    force_download: bool = False,
    key_files: Optional[list[str]] = None,
) -> str:
    local_path = Path(local_dir)
    local_path.mkdir(parents=True, exist_ok=True)

    if not repo_id:
        return str(local_path)

    if key_files is None:
        key_files = ["config.json"]

    needs_download = force_download
    if not needs_download:
        needs_download = not any((local_path / f).exists() for f in key_files)

    if needs_download:
        snapshot_download(
            repo_id=repo_id,
            revision=revision,
            token=token,
            local_dir=str(local_path),
            local_dir_use_symlinks=False,
            force_download=force_download,
        )

    return str(local_path)


def ensure_de_hf_assets_local(force_download: bool = False) -> tuple[str, str]:
    token = os.getenv("HF_TOKEN", "").strip() or None

    base_local_dir = os.getenv("DE_BASE_MODEL_PATH", "/tmp/de_base")
    reg_local_dir = os.getenv("DE_REG_LOCAL_DIR", "/tmp/de_reg")

    base_repo = os.getenv("DE_BASE_HF_REPO_ID", "").strip() or None
    reg_repo = os.getenv("DE_REG_HF_REPO_ID", "").strip() or None

    rev_global = os.getenv("DE_HF_REVISION", "main").strip() or None
    base_rev = os.getenv("DE_BASE_HF_REVISION", "").strip() or rev_global
    reg_rev = os.getenv("DE_REG_HF_REVISION", "").strip() or rev_global





    _ensure_hf_repo_local(
        repo_id=base_repo,
        local_dir=base_local_dir,
        revision=base_rev,
        token=token,
        force_download=force_download,
        key_files=["config.json"],  
    )

    _ensure_hf_repo_local(
        repo_id=reg_repo,
        local_dir=reg_local_dir,
        revision=reg_rev,
        token=token,
        force_download=force_download,
        key_files=[
            "pytorch_model.bin",       
            "tokenizer.json",          
            "config.json",
        ],
    )

    return base_local_dir, reg_local_dir









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
    base_local_dir, reg_local_dir = ensure_de_hf_assets_local(force_download=False)


    base_model_path = os.getenv("DE_BASE_MODEL_PATH", base_local_dir)
    ckpt_path = os.getenv("DE_CKPT_PATH", os.path.join(reg_local_dir, "pytorch_model.bin"))

    tokenizer_id = os.getenv("DE_TOKENIZER_ID", base_local_dir)

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
