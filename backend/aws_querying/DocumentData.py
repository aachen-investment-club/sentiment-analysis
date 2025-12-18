from datetime import date as dte
from typing import List
import uuid
import boto3
from io import StringIO
import pandas as pd

from boto3.dynamodb.conditions import Key, Attr
from backend.ml.preprocessing import extract_pdf_text

from backend.config import constants as const
from decimal import Decimal
import streamlit as st


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


    return response_dynamo["ResponseMetadata"]["HTTPStatusCode"] == 200 and response_s3["ResponseMetadata"]["HTTPStatusCode"] == 200


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

    text = extract_pdf_text(file)

    if add_article_text(
        date, 
        assets, 
        commodities, 
        markets,
        source,
        text, 
        title,
        language
    ): 
        return True
    return False


   


def list_articles(): 
    dynamodb = boto3.resource(const.DYNAMODB, region_name=const.AWS_REGION)
    table = dynamodb.Table(const.DYNAMO_TABLE_NAME)
    response = table.scan()

    if response["ResponseMetadata"]["HTTPStatusCode"]==200: 
        return response["Items"]


    return False

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
