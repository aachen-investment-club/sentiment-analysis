from enum import Enum


class Granularity(Enum): 
    MONTH_GRANULARITY =  "month"
    DAY_GRANULARITY = "day"


class Asset(Enum): 
    VIX= "^VIX"
    DAX= "^GDAXI"
    SPY=  "SPY"



S3_ARTICLES_BUCKET = "articles-sentiment"
DYNAMO_TABLE_NAME = "sentiment_document_data"
S3_PK = "DocumentID"
DYNAMODB = "dynamodb"
S3 = "s3"
AWS_REGION = "eu-central-1"