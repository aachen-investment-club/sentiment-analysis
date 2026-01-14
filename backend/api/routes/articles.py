"""Article-related API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from backend.aws_querying.DocumentData import list_articles
from backend.api.utils import transform_dynamodb_item

router = APIRouter(prefix="/api/articles", tags=["articles"])


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
