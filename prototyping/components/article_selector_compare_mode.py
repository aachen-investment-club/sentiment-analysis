import streamlit as st
from utils import setup_path
setup_path()
from backend.aws_querying.DocumentData import list_articles
from datetime import datetime

def article_selection(): 
    # Date filter section
    st.subheader("Filter by Date")
    col1, col2 = st.columns(2)
    
    with col1:
        month = st.selectbox(
            "Month",
            options=list(range(1, 13)),
            format_func=lambda x: datetime(2000, x, 1).strftime('%B')
        )
    
    with col2:
        # You can adjust the year range as needed
        current_year = datetime.now().year
        year = st.selectbox(
            "Year",
            options=list(range(2020, current_year + 1))
        )
    
    # Fetch and filter articles
    articles = list_articles()
    
    # Filter articles by selected month and year
    filtered_articles = []
    for article in articles:
        try:
            # Parse the article date (adjust format based on your date format)
            # Assuming date format is like "YYYY-MM-DD" or similar
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')  # Adjust format as needed
            
            if article_date.month == month and article_date.year == year:
                filtered_articles.append(article)
        except (ValueError, KeyError):
            # Skip articles with invalid or missing dates
            continue
    
    # Display count
    st.info(f"Found {len(filtered_articles)} articles in {datetime(year, month, 1).strftime('%B %Y')}")
    
    # Article selection UI
    selection = []
    for article in filtered_articles: 
        with st.container(border=True): 
            col1, col2 = st.columns([0.9, 0.1])
            checked = col2.checkbox("", key=article["DocumentID"])
            
            with col1: 
                st.markdown(f"**{article['title']}**")
                st.markdown(f"Date: {article['date']}")
                st.markdown(f"Source: {article['source']}")

                asset_tags = " ".join(
                    [f"<span style='background-color:green;padding:4px 10px;border-radius:10px;margin-right:5px;'>{a}</span>"
                     for a in article["assets"]]
                )
                st.markdown(f"**Article assets:** {asset_tags}", unsafe_allow_html=True)

                commodities_tags = " ".join(
                    [f"<span style='background-color:green;padding:4px 10px;border-radius:10px;margin-right:5px;'>{a}</span>"
                     for a in article["commodities"]]
                )
                st.markdown(f"**Article commodities:** {commodities_tags}", unsafe_allow_html=True)

                markets_tags = " ".join(
                    [f"<span style='background-color:green;padding:4px 10px;border-radius:10px;margin-right:5px;'>{a}</span>"
                     for a in article["markets"]]
                )
                st.markdown(f"**Article markets:** {markets_tags}", unsafe_allow_html=True)

            if checked: 
                selection.append(article["DocumentID"])

    if st.toggle("Commit selection"): 
        st.write(f"Selected articles: {selection}")
        return selection
    
    return []