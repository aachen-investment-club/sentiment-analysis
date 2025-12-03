import streamlit as st
import sys
import os


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)


from dotenv import load_dotenv
load_dotenv()


import boto3
from boto3.dynamodb.conditions import Key, Attr
import uuid
from datetime import date as dte
from backend.ml.sentiment_analysis import sentiment_analysis
from backend.aws_querying.DocumentData import add_to_table, scan_table


import pandas as pd



#: run this with (venv) PS C:\Users\benja\Escritorio\sentiment-analysis> streamlit run prototyping/test.py                        
#: from the root folder


inp = st.text_input("input something")
if inp: 

  st.write(inp)

  #"There is a shortage of capital, and we need extra financing. The future growth is strong and we have plenty of liquidity":

  st.write(sentiment_analysis(inp))



if st.toggle("scan table"): 
  st.write(scan_table())






if st.toggle("add a row to the table"): 

  date = str(dte.today())
  assets = st.multiselect(label ="select assets", options = ["NVDA", "INTEL", "AMD"])
  if st.toggle("commit row"): 
    st.write(add_to_table(date, assets))
