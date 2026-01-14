from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import articles

app = FastAPI(
    title="Sentiment Analysis API",
    description="API for financial sentiment analysis using FinBERT",
    version="1.0.0",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(articles.router)


@app.get("/")
async def root():
    """Root endpoint to verify API is running."""
    return {
        "message": "Sentiment Analysis API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

