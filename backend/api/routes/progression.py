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


class Filters(BaseModel):
    assets:List[str] 
    commodities:List[str]
    markets:List[str]


class CompareRequest(BaseModel):
    articles: List[ArticleMeta]
    filters: Filters

def get_sentiment_data_compare(articles: List[ArticleMeta]): 
    """
    this only extends each of the selected articles with their respective sentiment 
    results. 
    """
    
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
    
    return articles 



def get_compare_subplot_data(articles, category, selected_items): 
    output = {}
    for item in selected_items: 
        #: subdivide the articles based on the selected values of the category. 
        subselection = [article for article in articles if item in getattr(article, category)]
    

        if len(subselection) ==0: 
            continue

        dates = [article.date for article in subselection]
        sentiments = [article.average_sentiment for article in subselection]
        output[item] = {
            "dates":dates , 
            "sentiments": sentiments 
        }#: encodes the sentiment ts of the corresponding category

    return output









def get_sentiment_data_progression (articles: List[ArticleMeta]): 

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



@router.post("/compare_mode")
async def get_compare_data( data:CompareRequest):     
    """
    output format: 
    {
        "assets":{
            "asset1":{
                "dates":[...],
                "average_sentiment":[...]
            },
            ...
        }
        "commodities":{
            ...
        }
        "markets":{
            ...
        }
    }
    for example; every dict in "asssets" represents one set of points for the assets of 
    asset1.
    """


    data.articles = get_sentiment_data_compare(data.articles)


    output = {}
    if len(data.filters.assets)>0:
        output["assets"]= get_compare_subplot_data(data.articles, "assets", data.filters.assets)
    else : 
        output["assets"] = []

    if len(data.filters.commodities)>0:
        output["commodities"]= get_compare_subplot_data(data.articles, "commodities", data.filters.commodities)
    else : 
        output["commodities"] = []

    if len(data.filters.markets)>0:
        output["markets"]= get_compare_subplot_data(data.articles, "markets", data.filters.markets)
    else : 
        output["markets"] = []

    return output











@router.post("/start_analysis")
async def get_progression_data(articles: List[ArticleMeta] ):     

    data = get_sentiment_data_progression(articles)


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
