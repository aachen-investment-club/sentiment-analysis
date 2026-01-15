from fastapi import APIRouter, HTTPException 
from typing import List, Dict, Any, Optional
import pandas as pd
from backend.api.utils import transform_dynamodb_item
from pydantic import BaseModel
from backend.aws_querying.DocumentData import (get_articles_s3, 
                                               list_articles,
                                               get_sentiment_analysis_aws,
                                               check_exists_article_sentiment_analysis, 
                                               add_article_sentiment_analysis, get_document_labels )
router = APIRouter(prefix="/api/sentiment", tags=["sentiment"])



class ArticleMeta(BaseModel):
    DocumentID: str
    title:str 
    date: str
    source: str
    assets: List[str] 
    markets: List[str] 
    commodities: List[str] 
    file_name: str
    language: str
    average_sentiment:Optional[float] = None
    sentiment_label:Optional[str]  = None
    confidence:Optional[float]= None
    results :Optional[Any] = None





def get_sentiment_data (articles: List[ArticleMeta]): 

    article_file_names = tuple(article.file_name for article in articles)
    articles_contents = get_articles_s3(article_file_names)

    sentiment_results = get_sentiment_analysis_aws(articles, articles_contents)
    for article in articles:
        if article.file_name in sentiment_results.keys():
            avg, label, conf, results = sentiment_results[article.file_name]
            article.average_sentiment = avg
            article.sentiment_label = label
            article.confidence = conf
            article.results = results

    articles.sort(key=lambda d: d.date)
    
    dates = [article.date  for article in articles]
    sentiments = [article.average_sentiment for article in articles]
    
   
    df = pd.DataFrame({
        "date": dates, 
        "average_sentiment":sentiments 
    })

    df = (
        df
        .groupby("date", as_index=False)["average_sentiment"]
        .mean()
    )   
    data = {"date": [], "average_sentiment": []}
    data["date"] = list(df["date"])
    data["average_sentiment"] = list(df["average_sentiment"])

    #return df.to_dict(orient = "records")
    return data 



@router.post("/start_analysis")
async def get_progression_data(articles: List[ArticleMeta] ):     

    data = get_sentiment_data(articles)


    return {
        "title": "Sentiment over time",
        "points": data, 
        "dates": data["date"], 
        "sentiments": data["average_sentiment"]
    }




@router.get("", response_model=List[Dict[str, Any]])
async def get_articles():
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
