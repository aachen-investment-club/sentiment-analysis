from typing import List, Dict
import streamlit as st
from backend.ml.sentiment_analysis import sentiment_analysis_text 
from backend.aws_querying.DocumentData import (get_articles_s3, 
                                               check_exists_article_sentiment_analysis, 
                                               add_article_sentiment_analysis )
from tqdm import tqdm 
from backend.pdfoutput.pdf_components import PlotExport
from langdetect import detect, LangDetectException

import calendar

import plotly.graph_objects as go
from plotly.subplots import make_subplots

from backend.yfinance_querying.yfinance_querying import get_asset
from datetime import datetime

import pandas as pd


def is_article_german(article: dict) -> bool:
    """
    Detect if an article is in German based on its title.
    Returns True if German, False if English.
    Important to maintain the quality of the text. Without title, text will be assumed to be German (although possibly English) and translated to English.
    """
    text_to_analyze = None
    if article.get("title"):
        text_to_analyze = article["title"]
    
    if not text_to_analyze:
        # for default we assume the text to be german
        return True
    
    try:
        detected_lang = detect(text_to_analyze)
        return True if detected_lang == "de" else False
    except LangDetectException:
        return True


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
            # Load language from cached sentiment analysis if available
            if "language" in article_sentiment and "language" not in article:
                article["language"] = article_sentiment["language"]
            
            # Convert Decimal to float for consistency (DynamoDB returns Decimal)
            avg_sentiment = float(article_sentiment["average_sentiment"])
            confidence = float(article_sentiment["confidence"])
            
            results[file_name] = (avg_sentiment, article_sentiment["label"], 
                                  confidence, article_sentiment["details"])

        else: 
            # Get language from article metadata (from DynamoDB), detect if not available, or use cached value
            if "language" not in article:
                # Auto-detect if not provided (language not in article metadata from DynamoDB)
                is_german = is_article_german(article)
                article["language"] = "de" if is_german else "en"
            else:
                # Language already exists in article dict (from DynamoDB or previous processing)
                is_german = article["language"] == "de"
            
            average, sentiment_label, confidence, analysis_results = sentiment_analysis_text(
                articles_contents[file_name],
                is_german,
                True,
                False,
            )
            add_article_sentiment_analysis(
                article["DocumentID"], 
                average, 
                sentiment_label, 
                confidence, 
                analysis_results,
                article["language"]  # Store language in DynamoDB
            )

            results[file_name] = (
                average,
                sentiment_label,
                confidence,
                analysis_results,
            )
            st.write("done caching in dynamodb")

    return results




def launch_sentiment_analysis_progression(selected_articles: List, filters: Dict):
    """
    Analyzes sentiment for progression mode.
    Shows a single line chart of sentiment over time.
    Articles have been pre-filtered with intersection logic.
    
    Args:
        selected_articles: List of articles to analyze (already filtered)
        filters: Dict of applied filters (for display purposes)
    """
    
    # Run sentiment analysis on all articles
    article_file_names = tuple(article["file_name"] for article in selected_articles)
    articles_contents = get_articles_s3(article_file_names)
    


    sentiment_results = cached_sentiment_analysis(
        selected_articles, 
        articles_contents,
    )
    # Add sentiment results to articles
    for article in selected_articles:
        if article["file_name"] in sentiment_results:
            avg, label, conf, results = sentiment_results[article["file_name"]]
            article["average_sentiment"] = avg
            article["sentiment_label"] = label
            article["confidence"] = conf
            article["results"] = results
    
    # Sort articles by date
    selected_articles.sort(key=lambda d: d["date"])
    
    # Extract dates and sentiments
    dates = [article["date"] for article in selected_articles if "average_sentiment" in article]
    sentiments = [article["average_sentiment"] for article in selected_articles if "average_sentiment" in article]
    
    # Display title based on filters
    if filters:
        filter_parts = []
        if 'assets' in filters:
            filter_parts.append(f"Assets: {', '.join(filters['assets'])}")
        if 'markets' in filters:
            filter_parts.append(f"Markets: {', '.join(filters['markets'])}")
        if 'commodities' in filters:
            filter_parts.append(f"Commodities: {', '.join(filters['commodities'])}")
        
        st.subheader(f"Sentiment Progression")
        st.caption(" AND ".join(filter_parts))
    else:
        st.subheader("Sentiment Progression - All Articles")
    

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


def launch_sentiment_analysis_comparison(selected_articles: List):
    """
    Analyzes sentiment for articles and creates separate charts for each filter category.
    For example, if filters={'assets': ['nvidia', 'bitcoin'], 'markets': ['US', 'EU']},
    it will create two charts:
    - One chart with two lines (nvidia and bitcoin sentiment over time)
    - Another chart with two lines (US and EU sentiment over time)
    """
    
    # First, run sentiment analysis on all articles
    article_file_names = tuple(article["file_name"] for article in selected_articles)
    articles_contents = get_articles_s3(article_file_names)
    sentiment_results = cached_sentiment_analysis(
        selected_articles,
        articles_contents,
    )
    
    # Add sentiment results to articles
    for article in selected_articles:
        if article["file_name"] in sentiment_results:
            avg, label, conf, results = sentiment_results[article["file_name"]]
            article["average_sentiment"] = avg
            article["sentiment_label"] = label
            article["confidence"] = conf
            article["results"] = results
    
    # Sort articles by date
    selected_articles.sort(key=lambda d: d["date"])

    print("Are we at least here?")
    return selected_articles
    
def plot_sentiments_comparison_mode(articles, filters):
    
    # Create separate LINE charts for each filter category
    if 'assets' in filters and filters['assets']:
        st.subheader("Sentiment by Assets - Time Series")
        plot_sentiment_by_category(articles, 'assets', filters['assets'])
    
    if 'markets' in filters and filters['markets']:
        st.subheader("Sentiment by Markets - Time Series")
        plot_sentiment_by_category(articles, 'markets', filters['markets'])
    
    if 'commodities' in filters and filters['commodities']:
        st.subheader("Sentiment by Commodities - Time Series")
        plot_sentiment_by_category(articles, 'commodities', filters['commodities'])
    
    st.divider()
    
    # Create BAR charts for average sentiment comparison
    if 'assets' in filters and filters['assets']:
        st.subheader("Average Sentiment Comparison - Assets")
        plot_sentiment_bar_chart(articles, 'assets', filters['assets'])
    
    if 'markets' in filters and filters['markets']:
        st.subheader("Average Sentiment Comparison - Markets")
        plot_sentiment_bar_chart(articles, 'markets', filters['markets'])
    
    if 'commodities' in filters and filters['commodities']:
        st.subheader("Average Sentiment Comparison - Commodities")
        plot_sentiment_bar_chart(articles, 'commodities', filters['commodities'])


def plot_sentiment_bar_chart(articles: List, category: str, selected_items: List):
    """
    Creates a bar chart showing average sentiment for each item in the category.
    
    Args:
        articles: List of articles with sentiment data
        category: 'assets', 'markets', or 'commodities'
        selected_items: List of specific items to plot (e.g., ['nvidia', 'bitcoin'])
    """
    
    # Collect average sentiments for each item
    item_data = []
    
    for item in selected_items:
        # Filter articles that have this specific item
        item_articles = [
            article for article in articles 
            if item in article.get(category, []) and "average_sentiment" in article
        ]
        
        if not item_articles:
            continue
        
        # Calculate average sentiment for this item
        sentiments = [article["average_sentiment"] for article in item_articles]
        avg_sentiment = sum(sentiments) / len(sentiments)
        article_count = len(item_articles)
        
        item_data.append({
            'item': item,
            'avg_sentiment': avg_sentiment,
            'count': article_count
        })
    
    if not item_data:
        st.warning(f"No data available for {category}")
        return
    
    # Sort by average sentiment (descending)
    item_data.sort(key=lambda x: x['avg_sentiment'], reverse=True)
    
    # Create bar chart
    fig = go.Figure()
    
    # Determine colors based on sentiment (green for positive, red for negative)
    colors = ['green' if x['avg_sentiment'] > 0 else 'red' if x['avg_sentiment'] < 0 else 'gray' 
              for x in item_data]
    
    fig.add_trace(
        go.Bar(
            x=[x['item'] for x in item_data],
            y=[x['avg_sentiment'] for x in item_data],
            marker_color=colors,
            text=[f"{x['avg_sentiment']:.3f}" for x in item_data],
            textposition='outside',
            hovertemplate=(
                "<b>%{x}</b><br>" +
                "Avg Sentiment: %{y:.3f}<br>" +
                "Article Count: %{customdata}<br>" +
                "<extra></extra>"
            ),
            customdata=[x['count'] for x in item_data]
        )
    )
    
    # Update layout
    fig.update_layout(
        title=f"Average Sentiment - {category.capitalize()}",
        xaxis_title=category.capitalize(),
        yaxis_title="Average Sentiment Score",
        yaxis=dict(range=[-1, 1]),
        template="plotly_white",
        showlegend=False
    )
    
    # Add a horizontal line at y=0 for neutral sentiment
    fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5)
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Show detailed statistics table
    st.write(f"**Detailed Statistics for {category.capitalize()}:**")
    
    # Create a DataFrame for display
    stats_df = pd.DataFrame([
        {
            category.capitalize(): x['item'],
            'Avg Sentiment': f"{x['avg_sentiment']:.3f}",
            'Article Count': x['count'],
            'Label': 'Positive' if x['avg_sentiment'] > 0 else 'Negative' if x['avg_sentiment'] < 0 else 'Neutral'
        }
        for x in item_data
    ])
    
    st.dataframe(stats_df, use_container_width=True, hide_index=True)


def plot_sentiment_by_category(articles: List, category: str, selected_items: List):
    """
    Creates a line chart showing sentiment over time for each item in the category.
    
    Args:
        articles: List of articles with sentiment data
        category: 'assets', 'markets', or 'commodities'
        selected_items: List of specific items to plot (e.g., ['nvidia', 'bitcoin'])
    """
    
    fig = go.Figure()
    
    # For each selected item, create a separate line
    for item in selected_items:
        # Filter articles that have this specific item
        item_articles = [
            article for article in articles 
            if item in article.get(category, []) and "average_sentiment" in article
        ]
        
        if not item_articles:
            continue
        
        # Extract dates and sentiments for this item
        dates = [article["date"] for article in item_articles]
        sentiments = [article["average_sentiment"] for article in item_articles]
        
        # Add trace for this item
        fig.add_trace(
            go.Scatter(
                x=dates,
                y=sentiments,
                mode="lines+markers",
                name=item,
                hovertemplate=(
                    f"<b>{item}</b><br>" +
                    "Date: %{x}<br>" +
                    "Sentiment: %{y:.3f}<br>" +
                    "<extra></extra>"
                )
            )
        )
    
    # Update layout
    fig.update_layout(
        title=f"Sentiment Comparison - {category.capitalize()}",
        xaxis_title="Date",
        yaxis_title="Sentiment Score",
        yaxis=dict(range=[-1, 1]),
        template="plotly_white",
        hovermode="x unified",
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        )
    )
    
    # Add a horizontal line at y=0 for neutral sentiment
    fig.add_hline(y=0, line_dash="dash", line_color="gray", opacity=0.5)
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Show statistics
    st.write(f"**Statistics for {category.capitalize()}:**")
    
    for item in selected_items:
        item_articles = [
            article for article in articles 
            if item in article.get(category, []) and "average_sentiment" in article
        ]
        
        if item_articles:
            sentiments = [article["average_sentiment"] for article in item_articles]
            avg_sentiment = sum(sentiments) / len(sentiments)
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric(f"{item} - Average Sentiment", f"{avg_sentiment:.3f}")
            with col2:
                st.metric(f"{item} - Article Count", len(item_articles))
            with col3:
                sentiment_label = "Positive" if avg_sentiment > 0 else "Negative" if avg_sentiment < 0 else "Neutral"
                st.metric(f"{item} - Overall", sentiment_label)


def get_vix(): 
    if st.session_state.get('lower_bound_year') is None or st.session_state.get('lower_bound_month') is None: 
        start_date = datetime(2025, 1, 1)
    else: 
        start_date = datetime(
            int(st.session_state.lower_bound_year), 
            int(st.session_state.lower_bound_month), 
            1
        )

    data = get_asset(
        asset="^VIX",
        start_date=start_date,
    )
    data.index = data.index.to_pydatetime()

  
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

    title = st.text_input("Enter a title for the analysis entry"
                          , value = "Sentiment over time", key ="title_input_sentiment")

    st.plotly_chart(fig, use_container_width=True)


    avg_sentiment = df["average_sentiment"].mean()
    doc_count = len(df["average_sentiment"]) 
    sentiment_label = "Positive" if avg_sentiment > 0 else "Negative" if avg_sentiment < 0 else "Neutral"
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Average Sentiment", f"{avg_sentiment:.3f}")
    with col2:
        st.metric("Article Count", doc_count)
    with col3:
        st.metric("Overall Sentiment", sentiment_label)


    interpretation = st.text_area(
        label= "Enter an interpretation", 
        key = ""
    )

    if st.button("Add to article", key = "export_simple_plot"):
        fig_for_export = go.Figure(fig)
        fig_for_export.update_layout(annotations=[])

        metrics = [
            ("Avg Sentiment", f"{avg_sentiment:.2f}"),
            ("Documents",str( doc_count)),
            ("Overall", sentiment_label),
        ]
        export = PlotExport(
            title = title, 
            figure_bytes=fig_for_export, 
            metrics = metrics, 
            interpretation= interpretation
        )


        st.session_state.export_data.append(export)
        st.success("Added to article")


    



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

    title = st.text_input("Enter a title for the analysis entry"
                          , value = "Sentiment and VIX over time", key ="title_input_vix_sentiment")


    st.plotly_chart(fig, use_container_width=True)


    corr = compute_sentiment_vix_correlation(list(sentiments["date"]), list(sentiments["average_sentiment"]), vix_data)
    
    avg_sentiment = sentiments["average_sentiment"].mean()
    doc_count = len(sentiments["average_sentiment"]) 
    sentiment_label = "Positive" if avg_sentiment > 0 else "Negative" if avg_sentiment < 0 else "Neutral"
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Average Sentiment", f"{avg_sentiment:.3f}")
    with col2:
        st.metric("Article Count", doc_count)
    with col3:
        st.metric("Overall Sentiment", sentiment_label)
    with col4: 
        st.metric(
            "Sentiment–VIX Correlation", 
            f"{corr:.3f}",
            help="Correlation between sentiment scores and VIX levels. Values range from -1 to 1."
        )

    interpretation = st.text_area(
        label= "Enter an interpretation", 
        key = "interpretation_vis_sentiment", 
        value = "As we can see in the plot, the VIX correlates negatively with the sentiment. For example, over the months of april and may, there was high volatility in the market. In the same period, the sentiment was negative, therefore confirming an inverse correspondance over this period. Similarly, in periods of better sentiment, the VIX was low. " 
    )

    if st.button("Add to article", key = "export_sentiment_and_vix"):

        fig_for_export = go.Figure(fig)
        fig_for_export.update_layout(annotations=[])

        metrics = [
            ("Correlation",  f"{corr:.2f}"), 
            ("Avg Sentiment", f"{avg_sentiment:.2f}"),
            ("Documents", str(doc_count)),
            ("Overall", sentiment_label),
        ]
        export = PlotExport(
            title = title, 
            figure_bytes=fig_for_export, 
            metrics = metrics, 
            interpretation= interpretation
        )


        st.session_state.export_data.append(export)
        st.success("Added to article")







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