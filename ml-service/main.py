"""
FastAPI ML Microservice — Phishing URL Classifier
Start: uvicorn main:app --reload --port 8000
"""
import os
import joblib
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from feature_extractor import feature_vector, FEATURE_NAMES

MODEL_PATH = os.getenv("MODEL_PATH", "model.pkl")
_model_bundle = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model_bundle
    if os.path.exists(MODEL_PATH):
        _model_bundle = joblib.load(MODEL_PATH)
        print(f"[ML] Model loaded from {MODEL_PATH}")
    else:
        print(f"[ML] Warning: model file not found at {MODEL_PATH}. Train it first with train_model.py")
    yield

app = FastAPI(title="PhishGuard ML Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class URLRequest(BaseModel):
    url: str

    @field_validator('url')
    @classmethod
    def url_must_be_reasonable(cls, v: str) -> str:
        if len(v) > 2048:
            raise ValueError('URL too long')
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v


class PredictionResponse(BaseModel):
    url: str
    prediction: str
    probability: float
    features: dict


@app.post("/predict", response_model=PredictionResponse)
def predict(request: URLRequest):
    if _model_bundle is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run train_model.py first."
        )

    model = _model_bundle['model']
    fv = feature_vector(request.url)
    fv_array = np.array(fv).reshape(1, -1)

    prob = float(model.predict_proba(fv_array)[0][1])
    prediction = "Phishing" if prob >= 0.5 else "Legitimate"

    return {
        "url": request.url,
        "prediction": prediction,
        "probability": round(prob, 4),
        "features": dict(zip(FEATURE_NAMES, fv)),
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model_bundle is not None}
