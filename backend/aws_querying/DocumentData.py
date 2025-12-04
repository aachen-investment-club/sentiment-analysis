from datetime import date as dte
from typing import List
import uuid
import boto3
from boto3.dynamodb.conditions import Key, Attr
#import streamlit as st

ARTICLES_BUCKET = "articles-sentiment"
TABLE_NAME = "sentiment_document_data"
PK = "DocumentID"





def add_article_text(
    date: dte, 
    assets: List[str], 
    source: str,
    text 
): 
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE_NAME)

    s3 = boto3.client("s3")

    id = str(uuid.uuid1())

    response_dynamo = table.put_item(
        Item={
            PK: id,
            "date": str(date),
            "assets": assets,
            "source": source, 
            "file_name": id+".txt"
        }
    )

    response_s3 = s3.put_object(
        Bucket=ARTICLES_BUCKET,
        Key=id+ ".txt",
        Body=text
    )


    return response_dynamo["ResponseMetadata"]["HTTPStatusCode"] == 200 and response_s3["ResponseMetadata"]["HTTPStatusCode"] == 200








def add_article_pdf(
    date: dte, 
    assets: List[str], 
    source: str,
    file
): 
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(TABLE_NAME)

    s3 = boto3.client("s3")

    id = str(uuid.uuid1())

    response_dynamo = table.put_item(
        Item={
            PK: id,
            "date": str(date),
            "assets": assets,
            "source": source, 
            "file_name": id+".pdf"
        }
    )

    file.seek(0)
    response_s3 = s3.put_object(
        Bucket=ARTICLES_BUCKET,
        Key=id+ ".pdf",
        Body=file.read()
    )


    return response_dynamo["ResponseMetadata"]["HTTPStatusCode"] == 200 and response_s3["ResponseMetadata"]["HTTPStatusCode"] == 200

def scan_table(): 
    dynamodb = boto3.resource ("dynamodb")
    table = dynamodb.Table(TABLE_NAME)
    response = table.scan()

    if response["ResponseMetadata"]["HTTPStatusCode"]==200: 
        return response["Items"]


    return False



"""
def query_table(

): 
    dynamodb = boto3.resource ("dynamodb")
    table = dynamodb.Table(TABLE_NAME)

    response = table.query(
        KeyConditionExpression = Key(PK).eq("e0fa76e9-d075-11f0-b9bc-90e868412c08")
    )
    
"""
