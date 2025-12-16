import yfinance as yf
from datetime import date as dte
import pandas as pd


from backend.config import constants as const

def get_asset(asset: const.Asset,start_date: dte,  granularity:const.Granularity = const.Granularity.MONTH_GRANULARITY): 

    output = yf.download(
        asset, 
        interval = "1d", 
        start = start_date
        ) 

    if granularity == const.Granularity.DAY_GRANULARITY: 
        return output["Close"]
     
    return output["Close"].resample("M").mean()



