import yfinance as yf
from datetime import date as dte
from datetime import datetime

import pandas as pd


granularities = ["day", "month"]
assets = ["^VIX", "^GDAXI", "SPY"]

def get_asset(start_date: dte, asset: str, granularity = "month"): 

    output = yf.download(
        asset, 
        interval = "1d", 
        start = start_date
        ) 

    if granularity =="day": 
        return output["Close"]
     
    return output["Close"].resample("M").mean()



DAX = "^GDAXI"
SPY = "SPY"
VIX = "^VIX"
date = datetime(2025, 4, 1)
#print(get_asset(date, DAX))
#print(get_asset(date, SPY))
print(get_asset(date, VIX))
