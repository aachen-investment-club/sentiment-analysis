from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List
from contextlib import asynccontextmanager

from backend_finbert.german_finbert import load_de_from_env, analyze_sentiment_regression_de
from backend_finbert.english_finbert import load_en_from_env, analyze_sentiment_regression_en
from backend.ml.preprocessing import preprocess_text




@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.de_model = None
    app.state.de_tokenizer = None
    app.state.en_model = None
    app.state.en_tokenizer = None

    app.state.de_model, app.state.de_tokenizer = load_de_from_env()
    app.state.en_model, app.state.en_tokenizer = load_en_from_env()

    yield



app = FastAPI(lifespan=lifespan)



class PredictRequest(BaseModel):
    language: str = Field(..., pattern="^(de|en)$")
    text: str


@app.get("/health")
def health():
    return {
        "ok": True,
        "models": {
            "de": app.state.de_model is not None,
            "en": app.state.en_model is not None,
        },
    }


@app.post("/predict")
def predict(req: PredictRequest) -> Dict:
    sentences: List[str] = preprocess_text(req.text)

    if req.language == "de":
        if app.state.de_model is None or app.state.de_tokenizer is None:
            raise HTTPException(status_code=503, detail="German model not loaded")

        results = analyze_sentiment_regression_de(
            app.state.de_model,
            app.state.de_tokenizer,
            sentences,
            normalize=True,
        )
        return {"language": "de", "results": results}

    if req.language == "en":
        if app.state.en_model is None or app.state.en_tokenizer is None:
            raise HTTPException(status_code=503, detail="English model not loaded")

        results = analyze_sentiment_regression_en(
            app.state.en_model,
            app.state.en_tokenizer,
            sentences,
            normalize=True,
        )
        return {"language": "en", "results": results}

    raise HTTPException(status_code=400, detail="language must be 'de' or 'en'")



