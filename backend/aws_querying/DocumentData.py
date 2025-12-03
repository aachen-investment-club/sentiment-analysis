from datetime import date as dte
from typing import List
import uuid
import boto3
from boto3.dynamodb.conditions import Key, Attr



TABLE_NAME = "sentiment_document_data"
PK = "DocumentID"




def add_to_table(
    date:dte, 
    assets : List[str]
): 
    dynamodb = boto3.resource ("dynamodb")
    table = dynamodb.Table(TABLE_NAME)


    id = str(uuid.uuid1())

    response =  table.put_item(
        Item = {
        PK: id, 
        "date": date, 
        "assets": assets
        }
    )
    if response["ResponseMetadata"]["HTTPStatusCode"]==200: 
        return True


    return False



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
