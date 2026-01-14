# Backend API

FastAPI backend for the Sentiment Analysis application.

## Setup

1. Install dependencies:
```sh
cd backend
pip install -r requirements.txt
```

2. Run the development server:
   
   **Important:** Run uvicorn from the project root (one level up from the `backend` directory):
```sh
# From the project root (sentiment-analysis/)
uvicorn backend.main:app --reload
```

   The API will be available at `http://localhost:8000`

## Environment Variables

Create a `.env` file in the project root or set the following environment variables:

- `OPENAI_API_KEY` (optional): Required only if using LLM-based PDF text cleaning features
- AWS credentials: Configure via AWS CLI, environment variables, or IAM role:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_DEFAULT_REGION` (defaults to `eu-central-1`)

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs` (Swagger UI)
- Alternative docs: `http://localhost:8000/redoc` (ReDoc)

## API Endpoints

### Articles

#### `GET /api/articles`
Get all articles from DynamoDB.

**Response:**
```json
[
  {
    "DocumentID": "uuid-string",
    "title": "Article Title",
    "date": "2024-01-15",
    "source": "Reuters",
    "assets": ["BTC", "ETH"],
    "commodities": ["Gold"],
    "markets": ["Crypto", "US"],
    "file_name": "uuid-string.txt",
    "language": "en"
  }
]
```

**Status Codes:**
- `200`: Success
- `500`: Server error (database connection issue or internal error)

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── api/                       # API routes and utilities
│   ├── routes/               # API route handlers
│   │   └── articles.py       # Article endpoints
│   └── utils.py              # Data transformation utilities
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

## Note on Running the Server

The server must be run from the project root directory (not from within the `backend` folder) because the code uses absolute imports like `from backend.api.routes import articles`. This allows Python to properly resolve the `backend` module.
