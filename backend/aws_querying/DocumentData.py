from datetime import date as dte
from typing import List
import uuid
import boto3
from io import StringIO
import pandas as pd

from boto3.dynamodb.conditions import Key, Attr
from backend.ml.sentiment_analysis import sentiment_analysis_text 
from backend.ml.language_detection import is_article_german


from backend.config import constants as const
from decimal import Decimal


def add_article_sentiment_analysis(
    document_id, sentiment_average, label, confidence, details, language=None
):



    dynamodb = boto3.resource(const.DYNAMODB, region_name=const.AWS_REGION)
    table = dynamodb.Table(const.DYNAMO_TABLE_NAME_SENTIMENT)
    for detail in details: 
        detail["score"]= Decimal(str(detail["score"]))

    data = {
        "Document_ID": str(document_id), 
        "average_sentiment": Decimal(str(sentiment_average)), 
        "label": label, 
        "confidence": Decimal(str(confidence)), 
        "details": details
    }
    
    # Add language if provided
    if language:
        data["language"] = language

    response_dynamo = table.put_item(
        Item=data
    )

    return response_dynamo["ResponseMetadata"]["HTTPStatusCode"] == 200 


def check_exists_article_sentiment_analysis(document_id): 
    dynamodb = boto3.resource(const.DYNAMODB, region_name=const.AWS_REGION)
    table = dynamodb.Table(const.DYNAMO_TABLE_NAME_SENTIMENT)

    response = table.get_item(
        Key = {
            "Document_ID":document_id 
        }, 
    )
    if "Item" in response: 

        return response["Item"]

    return False 




def add_article_text(
    date: dte, 
    assets: List[str], 
    commodities: List[str], 
    markets: List[str], 
    source: str,
    text , 
    title,
    language: str = None
): 
    dynamodb = boto3.resource(const.DYNAMODB, region_name=const.AWS_REGION)
    table = dynamodb.Table(const.DYNAMO_TABLE_NAME)



    s3 = boto3.client(const.S3)

    id = str(uuid.uuid1())

    item = {
        const.S3_PK: id,
        "date": str(date),
        "assets": assets,
        "commodities": commodities,
        "markets": markets,
        "source": source, 
        "file_name": id+".txt", 
        "title": title
    }
    
    # Add language if provided
    if language:
        item["language"] = language
    
    response_dynamo = table.put_item(Item=item)

    response_s3 = s3.put_object(
        Bucket=const.S3_ARTICLES_BUCKET,
        Key=id+ ".txt",
        Body=text
    )

    # Return success status and document ID
    success = response_dynamo["ResponseMetadata"]["HTTPStatusCode"] == 200 and response_s3["ResponseMetadata"]["HTTPStatusCode"] == 200
    if success:
        return id
    return None


def get_document_labels(): 
    s3 = boto3.client(const.S3)
    files = [
        "markets.csv",
        "commodities.csv",
        "assets.csv"
    ]
    
    categories= [
        "markets",
        "commodities",
        "assets"
    ]

    results = {}

    for key,category in zip(files, categories):
        obj = s3.get_object(Bucket=const.S3_ARTICLES_BUCKET, Key=key)
        body= obj["Body"].read().decode("utf-8")
        df = pd.read_csv(StringIO(body))


        results[category] = df.iloc[:, -1].dropna().tolist()

    return results 



def add_article_pdf(
    date: dte, 
    assets: List[str], 
    commodities: List[str], 
    markets: List[str], 
    source: str,
    file, 
    title,
    language: str = None
): 
    dynamodb = boto3.resource(const.DYNAMODB, region_name=const.AWS_REGION)
    table = dynamodb.Table(const.DYNAMO_TABLE_NAME)

    s3 = boto3.client(const.S3)

    id = str(uuid.uuid1())

    item = {
        const.S3_PK: id,
        "date": str(date),
        "assets": assets,
        "commodities": commodities,
        "markets": markets,
        "source": source, 
        "file_name": id+".pdf", 
        "title": title
    }
    
    # Add language if provided
    if language:
        item["language"] = language
    
    response_dynamo = table.put_item(Item=item)

    from backend.pdfoutput.pdf_creation import extract_pdf_text
    text = extract_pdf_text(file)

    document_id = add_article_text(
        date, 
        assets, 
        commodities, 
        markets,
        source,
        text, 
        title,
        language
    )
    
    if document_id: 
        return True
    return False


   


def list_articles(): 
    dynamodb = boto3.resource(const.DYNAMODB, region_name=const.AWS_REGION)
    table = dynamodb.Table(const.DYNAMO_TABLE_NAME)
    response = table.scan()

    if response["ResponseMetadata"]["HTTPStatusCode"]==200: 
        return response["Items"]


    return False


def get_distinct_sources(): 
    """Return sorted list of unique source values from the documents table."""
    dynamodb = boto3.resource(const.DYNAMODB, region_name=const.AWS_REGION)
    table = dynamodb.Table(const.DYNAMO_TABLE_NAME)
    seen = set()
    params = {
        "ProjectionExpression": "#src",
        "ExpressionAttributeNames": {"#src": "source"},
    }
    while True:
        response = table.scan(**params)
        if response["ResponseMetadata"]["HTTPStatusCode"] != 200:
            return []
        for item in response.get("Items", []):
            src = item.get("source")
            if src and isinstance(src, str) and src.strip():
                seen.add(src.strip())
        if not response.get("LastEvaluatedKey"):
            break
        params["ExclusiveStartKey"] = response["LastEvaluatedKey"]
    return sorted(seen)

def get_articles_s3(articles: List[str]): 
    client= boto3.client(const.S3)


    response = client.list_objects_v2(Bucket = const.S3_ARTICLES_BUCKET)
    files = {}
    for article_name in articles: 
        response = client.get_object(
            Bucket = const.S3_ARTICLES_BUCKET, 
            Key = article_name
        )
        text = response["Body"].read().decode("utf-8")
        files[article_name] = text

    return files


"""
def query_table(

): 
    dynamodb = boto3.resource (const.DYNAMODB)
    table = dynamodb.Table(TABLE_NAME)

    response = table.query(
        KeyConditionExpression = Key(PK).eq("e0fa76e9-d075-11f0-b9bc-90e868412c08")
    )
    
"""


def get_sentiment_analysis_aws(
    selected_articles,
    articles_contents,
) :
    """
    this function is important! avoids having to re-run the sentiment analysis (still not ideal; storing the sentiment 
    is definitely the best solution)
    """
    results = {}
    article_file_names = [article.file_name for article in selected_articles]

    for article, file_name in zip(selected_articles, article_file_names):
        article_sentiment = check_exists_article_sentiment_analysis(article.DocumentID)
        if article_sentiment: 
            # Load language from cached sentiment analysis if available
            if "language" in article_sentiment and "language" not in article:
                article.language = article_sentiment["language"]
            
            # Convert Decimal to float for consistency (DynamoDB returns Decimal)
            avg_sentiment = float(article_sentiment["average_sentiment"])
            confidence = float(article_sentiment["confidence"])
            
            results[file_name] = (avg_sentiment, article_sentiment["label"], 
                                  confidence, article_sentiment["details"])

        else: 
            # Get language from article metadata, detect if not available
            if not hasattr(article, 'language') or not article.language:
                # Auto-detect language if not provided
                article_text = articles_contents.get(file_name, "")
                is_german = is_article_german(
                    article_title=article.title if hasattr(article, 'title') else None,
                    article_text=article_text
                )
                article.language = "de" if is_german else "en"
            else:
                is_german = article.language == "de"
            
            average, sentiment_label, confidence, analysis_results = sentiment_analysis_text(
                articles_contents[file_name],
                is_german,
                True,
                False,
            )
            add_article_sentiment_analysis(
                article.DocumentID, 
                average, 
                sentiment_label, 
                confidence, 
                analysis_results,
                article.language  # Store detected language in DynamoDB
            )

            results[file_name] = (
                average,
                sentiment_label,
                confidence,
                analysis_results,
            )

    return results






