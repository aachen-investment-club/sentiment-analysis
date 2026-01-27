from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime, date
from backend.api.deps import get_current_user
from backend.api.utils import transform_dynamodb_item
from pydantic import BaseModel
from backend.aws_querying.DocumentData import (get_articles_s3, 
                                               list_articles,
                                               get_sentiment_analysis_aws,
                                               check_exists_article_sentiment_analysis, 
                                               add_article_sentiment_analysis, get_document_labels )
from backend.yfinance_querying.yfinance_querying import get_asset
from backend.config import constants as const
from backend.pdfoutput.pdf_creation import generate_pdf
from backend.pdfoutput.pdf_components import PlotExport
import plotly.graph_objects as go
from plotly.subplots import make_subplots
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




@router.get("/vix")
async def get_vix_data(start_date: Optional[str] = None):
    """
    Fetch VIX data from yfinance.
    
    Args:
        start_date: Optional start date in YYYY-MM-DD format. If not provided, defaults to 2025-01-01.
    
    Returns:
        Dictionary with dates and VIX values as lists.
    """
    try:
        if start_date:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        else:
            start_date_obj = date(2025, 1, 1)
        
        vix_data = get_asset(
            asset=const.Asset.VIX.value,
            start_date=start_date_obj,
            granularity=const.Granularity.DAY_GRANULARITY
        )
        
        # Ensure we have a pandas Series
        if not isinstance(vix_data, pd.Series):
            raise ValueError(f"Expected pandas Series, got {type(vix_data)}")
        
        # Convert index to datetime if needed
        if not isinstance(vix_data.index, pd.DatetimeIndex):
            vix_data.index = pd.to_datetime(vix_data.index)
        
        # Drop NaN values
        vix_data = vix_data.dropna()
        
        # Check if we have any data
        if len(vix_data) == 0:
            return {
                "dates": [],
                "values": []
            }
        
        # Convert index to string dates using pandas
        dates = vix_data.index.strftime("%Y-%m-%d").tolist()
        
        # Convert values to list of floats
        values = vix_data.astype(float).tolist()
        
        return {
            "dates": dates,
            "values": values
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch VIX data: {str(e)}\n{traceback.format_exc()}"
        )


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


class MetricItem(BaseModel):
    label: str
    value: str


class ExportItem(BaseModel):
    type: str
    title: str
    interpretation: str
    metrics: List[MetricItem]
    dates: Optional[List[str]] = None
    sentiments: Optional[List[float]] = None
    vixDates: Optional[List[str]] = None
    vixValues: Optional[List[float]] = None
    # For comparison plots
    seriesData: Optional[Dict[str, Dict[str, Any]]] = None
    averages: Optional[Dict[str, float]] = None
    category: Optional[str] = None


class PDFExportRequest(BaseModel):
    exportData: List[ExportItem]


@router.post("/export_pdf")
async def export_pdf(request: PDFExportRequest, current_user: dict = Depends(get_current_user)):
    """
    Generate PDF from export data.
    
    Accepts export data with plot information and generates a PDF report.
    """
    try:
        plot_exports = []
        
        for item in request.exportData:
            # Convert metrics to tuple format expected by PlotExport
            metrics = [(m.label, m.value) for m in item.metrics]
            
            # Create Plotly figure based on type
            if item.type == 'sentiment_progression':
                # Create sentiment progression plot
                fig = go.Figure()
                fig.add_trace(
                    go.Scatter(
                        x=item.dates,
                        y=item.sentiments,
                        mode="lines+markers",
                        name="Sentiment"
                    )
                )
                fig.update_layout(
                    title="Sentiment progression over time",
                    xaxis_title="Date",
                    yaxis_title="Sentiment score",
                    yaxis=dict(range=[-1, 1]),
                    template="plotly_white"
                )
                
            elif item.type == 'sentiment_vix':
                # Create sentiment and VIX comparison plot
                fig = make_subplots(specs=[[{"secondary_y": True}]])
                
                # Sentiment trace (primary axis)
                fig.add_trace(
                    go.Scatter(
                        x=item.dates,
                        y=item.sentiments,
                        mode="lines+markers",
                        name="Sentiment Score",
                    ),
                    secondary_y=False,
                )
                
                # VIX trace (secondary axis)
                if item.vixDates and item.vixValues:
                    fig.add_trace(
                        go.Scatter(
                            x=item.vixDates,
                            y=item.vixValues,
                            mode="lines",
                            name="VIX",
                            opacity=0.6,
                        ),
                        secondary_y=True,
                    )
                
                fig.update_layout(
                    title="Sentiment vs Market Volatility (VIX)",
                    template="plotly_white",
                    legend=dict(x=0.01, y=0.99),
                )
                
                fig.update_yaxes(
                    title_text="Sentiment Score",
                    range=[-1, 1],
                    secondary_y=False,
                )
                
                fig.update_yaxes(
                    title_text="VIX Level",
                    secondary_y=True,
                )
                
                fig.update_xaxes(title_text="Date")
            
            elif item.type.startswith('compare_lines_'):
                # Create comparison lines plot (time series with multiple series)
                fig = go.Figure()
                
                if item.seriesData:
                    for series_name, series_data in item.seriesData.items():
                        dates = series_data.get('dates', [])
                        sentiments = series_data.get('sentiments', [])
                        
                        fig.add_trace(
                            go.Scatter(
                                x=dates,
                                y=sentiments,
                                mode="lines+markers",
                                name=series_name
                            )
                        )
                
                category = item.category or 'Items'
                fig.update_layout(
                    title=f"Sentiment by {category} - Time Series",
                    xaxis_title="Date",
                    yaxis_title="Sentiment score",
                    yaxis=dict(range=[-1, 1]),
                    template="plotly_white",
                    legend=dict(orientation="h", x=0, y=-0.25)
                )
            
            elif item.type.startswith('compare_bars_'):
                # Create comparison bars plot (average sentiment comparison)
                fig = go.Figure()
                
                if item.averages:
                    labels = list(item.averages.keys())
                    values = list(item.averages.values())
                    
                    fig.add_trace(
                        go.Bar(
                            x=labels,
                            y=values,
                            name="Average Sentiment"
                        )
                    )
                
                category = item.category or 'Items'
                fig.update_layout(
                    title=f"Average Sentiment Comparison - {category}",
                    xaxis_title=category,
                    yaxis_title="Average sentiment",
                    yaxis=dict(range=[-1, 1]),
                    template="plotly_white"
                )
            
            else:
                continue  # Skip unknown types
            
            # Remove annotations for cleaner export
            fig.update_layout(annotations=[])
            
            # Create PlotExport object
            plot_export = PlotExport(
                title=item.title,
                figure_bytes=fig,
                metrics=metrics,
                interpretation=item.interpretation
            )
            
            plot_exports.append(plot_export)
        
        # Generate PDF
        pdf_bytes = generate_pdf(plot_exports)
        
        # Return PDF as response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=generated_report.pdf"
            }
        )
        
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF: {str(e)}\n{traceback.format_exc()}"
        )
