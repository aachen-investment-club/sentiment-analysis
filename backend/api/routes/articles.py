"""Article-related API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

from backend.aws_querying.DocumentData import list_articles, get_document_labels, get_distinct_sources, add_article_text, add_article_sentiment_analysis
from backend.api.deps import get_current_user
from backend.api.utils import transform_dynamodb_item
from backend.ml.sentiment_analysis import sentiment_analysis_text
from backend.ml.language_detection import detect_language
from backend.ml.language_detection import is_article_german
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/api/articles", tags=["articles"])


class Article(BaseModel):
    date: str = Field(..., min_length=1, description="Reference date is required")
    assets: List[str] = Field(..., min_length=1, description="At least one asset is required")
    commodities: List[str]
    markets: List[str]
    source: str = Field(..., min_length=1, description="Source is required")
    title: str = Field(..., min_length=1, description="Title is required")
    language: str
    text: str = Field(..., min_length=1, description="Article content is required")

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Reference date is required')
        return v.strip()

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Title is required')
        return v.strip()

    @field_validator('source')
    @classmethod
    def validate_source(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Source is required')
        return v.strip()

    @field_validator('assets')
    @classmethod
    def validate_assets(cls, v: List[str]) -> List[str]:
        if not v or len(v) == 0:
            raise ValueError('At least one related asset is required')
        return v

    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Article content is required')
        return v.strip()


class AnalyzeTextRequest(BaseModel):
    text: str


@router.get("/categories", response_model=Dict[str, List])
async def get_categories_labels():
    doc_labels = get_document_labels()
    return doc_labels




DEFAULT_SOURCES = ["Reuters", "Bloomberg", "WSJ", "Bitcoin.com News", "Internal"]


@router.get("/sources", response_model=List[str])
async def get_sources():
    """Return distinct sources from documents, merged with defaults so the list is never empty."""
    from_db = get_distinct_sources()
    combined = {s for s in from_db}
    for s in DEFAULT_SOURCES:
        combined.add(s)
    return sorted(combined)


@router.post("/upload_article", response_model= Dict[str, Any])
async def upload_article(article: Article, current_user: dict = Depends(get_current_user)):
    # Save article to database
    document_id = add_article_text(
        article.date, 
        article.assets, 
        article.commodities, 
        article.markets, 
        article.source, 
        article.text, 
        article.title, 
        article.language
    )
    
    if not document_id: 
        raise HTTPException(
            status_code=400,
            detail="Failed to save article to database"
        )
    
    # Perform sentiment analysis
    try:
        # Determine if article is German
        is_german = article.language.lower() == "de" if article.language else False
        if not is_german:
            # Auto-detect language if not explicitly set
            is_german = is_article_german(
                article_title=article.title,
                article_text=article.text
            )
        
        # Run sentiment analysis
        average, sentiment_label, confidence, analysis_results = sentiment_analysis_text(
            article.text,
            is_german,
            regression=True,
            normalize=False
        )
        
        # Store sentiment analysis results
        language_code = "de" if is_german else "en"
        sentiment_saved = add_article_sentiment_analysis(
            document_id,
            average,
            sentiment_label,
            confidence,
            analysis_results,
            language_code
        )
        
        if sentiment_saved:
            return {
                "status": "success",
                "document_id": document_id,
                "sentiment_analyzed": True,
                "sentiment": {
                    "average": float(average),
                    "label": sentiment_label,
                    "confidence": float(confidence)
                }
            }
        else:
            return {
                "status": "success",
                "document_id": document_id,
                "sentiment_analyzed": False,
                "message": "Article saved but sentiment analysis failed to save"
            }
            
    except Exception as e:
        # Article is saved, but sentiment analysis failed
        return {
            "status": "success",
            "document_id": document_id,
            "sentiment_analyzed": False,
            "message": f"Article saved but sentiment analysis failed: {str(e)}"
        }

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_text(request: AnalyzeTextRequest, current_user: dict = Depends(get_current_user)):
    """
    Analyze sentiment of text input.
    
    Args:
        request: Text to analyze
        
    Returns:
        Dictionary with:
        - overall_sentiment: str (POSITIVE/NEGATIVE/NEUTRAL)
        - confidence: float (0-100)
        - positive_percentage: float
        - negative_percentage: float
        - neutral_percentage: float
        - sentences: List of sentence results with text, sentiment, and confidence
    """
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty"
            )
        
        # Detect language
        detected_lang = detect_language(request.text)
        is_german = detected_lang == "de"

        # Analyze sentiment using German or English regression model
        # Returns: (average_score, overall_sentiment_label, confidence, sentence_results)
        average, overall_sentiment, confidence, results = sentiment_analysis_text(
            request.text,
            german=is_german,
            regression=True,
            normalize=False
        )
        
        # Calculate percentages based on regression score thresholds
        # Using same thresholds as aggregate_sentiment_regression
        total = len(results)
        positive_threshold = 0.05
        negative_threshold = -0.05
        
        positive_count = sum(1 for r in results if r.get('score', 0) > positive_threshold)
        negative_count = sum(1 for r in results if r.get('score', 0) < negative_threshold)
        neutral_count = total - positive_count - negative_count
        
        positive_percentage = round((positive_count / total * 100) if total > 0 else 0, 1)
        negative_percentage = round((negative_count / total * 100) if total > 0 else 0, 1)
        neutral_percentage = round((neutral_count / total * 100) if total > 0 else 0, 1)
        
        # Format sentence results with text (sentence comes from FinBERT backend)
        sentence_results = []
        for result in results:
            score = result.get('score', 0.0)
            sentence_text = result.get('sentence', '')
            
            # Determine sentiment label from score (using same thresholds)
            if score > positive_threshold:
                sentiment_label = 'POSITIVE'
            elif score < negative_threshold:
                sentiment_label = 'NEGATIVE'
            else:
                sentiment_label = 'NEUTRAL'
            
            sentence_results.append({
                'text': sentence_text,
                'sentiment': sentiment_label,
                'confidence': round(abs(score) * 100, 1),  # Use absolute score as confidence
                'score': score
            })
        
        return {
            "overall_sentiment": overall_sentiment.upper(),
            "confidence": round(confidence, 1),
            "positive_percentage": positive_percentage,
            "negative_percentage": negative_percentage,
            "neutral_percentage": neutral_percentage,
            "sentences": sentence_results,
            "total_sentences": total,
            "detected_language": detected_lang,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("", response_model=List[Dict[str, Any]])
async def get_articles():
    """
    Get all articles from DynamoDB.
    
    Returns:
        List of article objects with the following structure:
        - DocumentID: str
        - title: str
        - date: str (YYYY-MM-DD format)
        - source: str
        - assets: List[str]
        - commodities: List[str]
        - markets: List[str]
        - file_name: str (optional)
        - language: str (optional)
    """
    try:
        articles = list_articles()
        
        if articles is False:
            # list_articles() returns False on error
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve articles from database"
            )
        
        # Transform DynamoDB items to JSON-serializable format
        transformed_articles = [transform_dynamodb_item(article) for article in articles]
        return transformed_articles
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
