

from typing import List
import streamlit as st
from backend.ml.sentiment_analysis import sentiment_analysis_text 
from tqdm import tqdm 

import calendar

import plotly.graph_objects as go
from plotly.subplots import make_subplots

from backend.aws_querying.DocumentData import (get_articles_s3, 
                                               check_exists_article_sentiment_analysis, 
                                               add_article_sentiment_analysis )
from backend.yfinance_querying.yfinance_querying import get_asset
from datetime import datetime

import pandas as pd


@st.cache_data(show_spinner="Running sentiment analysis...")
def cached_sentiment_analysis(
    selected_articles,
    articles_contents,
) :
    """
    this function is important! avoids having to re-run the sentiment analysis (still not ideal; storing the sentiment 
    is definitely the best solution)
    """
    results = {}

    article_file_names = [article["file_name"] for article in selected_articles]

    for article, file_name in zip(selected_articles, article_file_names):
        article_sentiment = check_exists_article_sentiment_analysis(article["DocumentID"])
        if article_sentiment: 
            results[file_name] = (article_sentiment["average_sentiment"], article_sentiment["label"], 
                                  article_sentiment["confidence"], article_sentiment["details"])

        else: 

            average, sentiment_label, confidence, analysis_results = sentiment_analysis_text(
                articles_contents[file_name],
                True,
                True,
                False,
            )
            add_article_sentiment_analysis(
                article["DocumentID"], 
                average, 
                sentiment_label, 
                confidence, 
                analysis_results
                
            )

            results[file_name] = (
                average,
                sentiment_label,
                confidence,
                analysis_results,
            )
            st.write("done caching in dynamodb")

    return results



def launch_sentiment_analysis(selected_articles: List):
    article_file_names = tuple(article["file_name"] for article in selected_articles)

    articles_contents = get_articles_s3(article_file_names)

    sentiment_results = cached_sentiment_analysis(
        selected_articles, 
        articles_contents,
    )

    for article in selected_articles:
        avg, label, conf, results = sentiment_results[article["file_name"]]
        article["average_sentiment"] = avg
        article["sentiment_label"] = label
        article["confidence"] = conf
        article["results"] = results

    selected_articles.sort(key=lambda d: d["date"])

    dates = [article["date"] for article in selected_articles]
    sentiments = [article["average_sentiment"] for article in selected_articles]
    df = pd.DataFrame({
        "date": dates, 
        "average_sentiment":sentiments 
    })


    df = (
        df
        .groupby("date", as_index=False)["average_sentiment"]
        .mean()
    )   



    return df




def get_vix (): 
    if  st.session_state.lower_bound_year is None or st.session_state.lower_bound_month is None: 
        start_date=datetime(2025, 1, 1)
    else: 
        start_date = datetime (
            int(st.session_state.lower_bound_year), 
            int(st.session_state.lower_bound_month), 
            1
        )


    data = get_asset(
        asset="^VIX",
        start_date=start_date,
    )
    data.index = data.index.to_pydatetime()


    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=data.index,
            y=data[data.columns[0]],
            mode="lines",
            name="VIX"
        )
    )

    fig.update_layout(
        title="VIX",
        xaxis_title="Date",
        yaxis_title="Value",
        template="plotly_white"
    )

    # render in streamlit
    st.plotly_chart(fig, use_container_width=True)
    return data




def plot_dates_vs_sentiments(df): 
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["date"],
            y=df["average_sentiment"],
            mode="lines+markers",
            name="Values"
        )
    )

    fig.update_layout(
        title="Sentiment progression over time",
        xaxis_title="Date",
        yaxis_title="Sentiment score",
        yaxis=dict(range=[-1, 1]),
        template="plotly_white"
    )
    st.plotly_chart(fig, use_container_width=True)

    interpretation = st.text_area(
        label= "Enter an interpretation", 
        key = ""
    )
    if st.toggle("add to article"): 
        fig_for_export = go.Figure(fig)  # shallow copy
        fig_for_export.update_layout(annotations=[])
        data ={
            "figure": fig_for_export, 
            "interpretation": interpretation
        }
        st.session_state.export_data.append(data)





def plot_sentiment_and_vix(sentiments, vix_data):
    """
    dates: list of article dates (strings or datetimes)
    sentiments: list of sentiment scores
    vix_data: DataFrame returned by get_vix()
    """

    fig = make_subplots(specs=[[{"secondary_y": True}]])

    # Sentiment trace (primary axis)
    fig.add_trace(
        go.Scatter(
            x=pd.to_datetime(sentiments["date"]),
            y=sentiments["average_sentiment"],
            mode="lines+markers",
            name="Sentiment Score",
        ),
        secondary_y=False,
    )

    # VIX trace (secondary axis)
    fig.add_trace(
        go.Scatter(
            x=vix_data.index,
            y=vix_data[vix_data.columns[0]],
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

    st.plotly_chart(fig, use_container_width=True)




def align_vix_to_articles(dates, vix_data):
    """
    Aligns daily VIX data to article dates using forward-fill.
    """
    vix_series = vix_data[vix_data.columns[0]]

    article_dates = pd.to_datetime(dates)

    aligned_vix = (
        vix_series
        .reindex(article_dates, method="ffill")
    )

    return aligned_vix

def compute_sentiment_vix_correlation(dates, sentiments, vix_data):
    aligned_vix = align_vix_to_articles(dates, vix_data)

    df = pd.DataFrame({
        "sentiment": sentiments,
        "vix": aligned_vix.values,
    }).dropna()

    corr = df["sentiment"].corr(df["vix"], method="pearson")

    return corr