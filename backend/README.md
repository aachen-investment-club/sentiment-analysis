# Backend API

FastAPI backend for the Sentiment Analysis application.

## Setup

1. Install dependencies:
```sh
pip install -r requirements.txt
```

2. Run the development server:
```sh
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs` (Swagger UI)
- Alternative docs: `http://localhost:8000/redoc` (ReDoc)

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── ml/                        # Machine learning services
│   ├── preprocessing.py      # PDF text extraction and cleaning
│   ├── sentiment_analysis.py  # Main sentiment analysis pipeline
│   ├── finbert_sentiment.py  # FinBERT models (English & German)
│   └── finbert_regression.py # FinBERT regression models
├── aws_querying/              # AWS integration
│   └── DocumentData.py       # DynamoDB document data handling
├── requirements.txt          # Backend dependencies
└── README.md                 # This file
```






