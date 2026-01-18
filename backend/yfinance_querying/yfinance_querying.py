import yfinance as yf
from datetime import date as dte
import pandas as pd


from backend.config import constants as const

def get_asset(asset: const.Asset,start_date: dte,  granularity:const.Granularity = const.Granularity.MONTH_GRANULARITY): 
    ticker = get_ticker_from_company_name(asset)

    output = yf.download(
        ticker, 
        interval = "1d", 
        start = start_date
        ) 

    if granularity == const.Granularity.DAY_GRANULARITY: 
        result = output["Close"]
        
        # Handle MultiIndex columns (yfinance returns MultiIndex for single ticker)
        # If result is a DataFrame, squeeze it to a Series
        if isinstance(result, pd.DataFrame):
            result = result.squeeze()
        
        return result
     
    close_data = output["Close"]
    if isinstance(close_data, pd.DataFrame):
        close_data = close_data.squeeze()
    return close_data.resample("M").mean()


def get_ticker_from_company_name(asset: str):
    search = yf.Search(asset)
    results = search.quotes
    return results[0]["symbol"]
