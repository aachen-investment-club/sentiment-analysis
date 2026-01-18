"""Article-related API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from backend.aws_querying.DocumentData import list_articles, get_document_labels, add_article_text
from backend.api.utils import transform_dynamodb_item
from backend.ml.sentiment_analysis import sentiment_analysis_text
from backend.ml.language_detection import detect_language
from pydantic import BaseModel

router = APIRouter(prefix="/api/articles", tags=["articles"])


class Article(BaseModel):
    date: str
    assets: List[str]
    commodities: List[str]
    markets: List[str]
    source: str
    title: str
    language: str
    text: str


class AnalyzeTextRequest(BaseModel):
    text: str


@router.get("/categories", response_model=Dict[str, List])
async def get_categories_labels():
    doc_labels = get_document_labels()
    print(doc_labels.keys())

    return doc_labels




@router.get("/sources", response_model=List[str])
async def get_sources():
    
    return ['Reuters', 'Bloomberg', 'WSJ', 'Bitcoin.com News', 'Internal']


@router.post("/upload_article", response_model= Dict[str, Any])
async def upload_article(article: Article):

    print(article.date)
    out = add_article_text(
        article.date, 
        article.assets, 
        article.commodities, 
        article.markets, 
        article.source, 
        article.text, 
        article.title, 
        article.language
    )
    if out: 
        print("done uploading")
        return {"status": "success"}

    raise HTTPException(
        status_code=400,
        detail="Invalid article data"
    )











@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_text(request: AnalyzeTextRequest):
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
        
        # Get preprocessed sentences first
        from backend.ml.preprocessing import preprocess_text
        from backend.ml.translation import translate_to_english
        
        preprocessed_sentences = preprocess_text(request.text)
        if is_german:
            preprocessed_sentences = translate_to_english(preprocessed_sentences)
        
        # Analyze sentiment using regression model
        # Returns: (average_score, overall_sentiment_label, confidence, sentence_results)
        # Note: analyze_sentiment_regression already includes sentence text in results
        average, overall_sentiment, confidence, results = sentiment_analysis_text(
            request.text,
            german=is_german,
            regression=True,
            normalize=False
        )
        
        # Ensure sentence text is in results (should already be there from regression model)
        for i, result in enumerate(results):
            if 'sentence' not in result and i < len(preprocessed_sentences):
                result['sentence'] = preprocessed_sentences[i]
        
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
        
        # Format sentence results with text
        sentence_results = []
        for i, result in enumerate(results):
            score = result.get('score', 0.0)
            sentence_text = result.get('sentence', preprocessed_sentences[i] if i < len(preprocessed_sentences) else "")
            
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
            "total_sentences": total
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
        print(transformed_articles[0])
        
        return transformed_articles
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
