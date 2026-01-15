"""Article-related API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from backend.aws_querying.DocumentData import list_articles, get_document_labels, add_article_text
from backend.api.utils import transform_dynamodb_item
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
