import streamlit as st
from datetime import datetime
from utils import setup_path
setup_path()
from backend.aws_querying.DocumentData import list_articles

def article_selection_progression_mode(): 

    articles = list_articles()
    selection = []
    for article in articles: 
        with st.container(border = True): 
            col1, col2 = st.columns([0.9,0.1])
            checked = col2.checkbox ("", key = article["DocumentID"])
        with col1: 
            st.markdown(f"{article['title']}")
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


            markets_tags= " ".join(
                [f"<span style='background-color:green;padding:4px 10px;border-radius:10px;margin-right:5px;'>{a}</span>"
                 for a in article["markets"]]
            )
            st.markdown(f"**Article markets:** {markets_tags}", unsafe_allow_html=True)



        if checked: 
            selection.append(article["DocumentID"])

    if st.toggle("Commit selection"): 
        st.write(f"selected articles: {selection}")

    # TODO: the part where the documents are fetched for analysis should be executed when 
    # the analysis is started 

def article_selection_compare_mode(): 
    # Fetch all articles first
    articles = list_articles()
    
    # Extract available years and months from the data
    available_years = set()
    available_months = set()
    
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')  # Adjust format as needed
            available_years.add(article_date.year)
            available_months.add(article_date.month)
        except (ValueError, KeyError):
            continue
    
    # Convert to sorted lists
    available_years = sorted(list(available_years), reverse=True)  # Most recent first
    available_months = sorted(list(available_months))  # January to December
    
    # Date range filter section
    st.subheader("Filter by Date")
    
    if not available_years or not available_months:
        st.warning("No articles with valid dates found.")
        return []
    
    # Multi-select for years and months (only showing available ones)
    selected_years = st.multiselect(
        "Select Year(s)",
        options=available_years,
        default=[]
    )
    
    selected_months = st.multiselect(
        "Select Month(s)",
        options=available_months,
        format_func=lambda x: datetime(2000, x, 1).strftime('%B'),
        default=[]
    )
    
    # Validation
    if not selected_years or not selected_months:
        st.warning("Please select at least one year and one month to filter articles.")
        return []
    
    # Filter articles by selected years and months
    filtered_articles = []
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')  # Adjust format as needed
            
            if article_date.year in selected_years and article_date.month in selected_months:
                filtered_articles.append(article)
        except (ValueError, KeyError):
            continue
    
    # Display selected filters and count
    years_str = ", ".join(map(str, sorted(selected_years)))
    months_str = ", ".join([datetime(2000, m, 1).strftime('%B') for m in sorted(selected_months)])
    st.info(f"Filtering: {months_str} in years {years_str}")
    st.success(f"Found {len(filtered_articles)} articles")
    
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



def article_selection_lower_bound(): 
    # Fetch all articles first
    articles = list_articles()
    
    # Extract available years and months from the data
    available_years = set()
    available_months = set()
    
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')  # Adjust format as needed
            available_years.add(article_date.year)
            available_months.add(article_date.month)
        except (ValueError, KeyError):
            continue
    
    # Convert to sorted lists
    available_years = sorted(list(available_years), reverse=True)  # Most recent first
    available_months = sorted(list(available_months))  # January to December
    
    # Date range filter section
    st.subheader("Filter by Date")
    
    if not available_years or not available_months:
        st.warning("No articles with valid dates found.")
        return []
    
    # Multi-select for years and months (only showing available ones)
    selected_year = st.selectbox(
        "Select Starting Year",
        options=available_years,
    )
    
    selected_month = st.selectbox(
        "Select Starting Month",
        options=available_months,
        format_func=lambda x: datetime(2000, x, 1).strftime('%B'),
    )
    
    # Validation
    if not selected_year or not selected_month:
        st.warning("Please select at least one year and one month to filter articles.")
        return []
    
    # Filter articles by selected years and months
    
    lower_bound = datetime(selected_year, selected_month, 1)

    filtered_articles = []
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')  

            if article_date >= lower_bound:
                filtered_articles.append(article)

        except (ValueError, KeyError):
            continue
    
    # Display selected filters and count
    st.info(f"Filtering: articles staring from {selected_month} in year {selected_year}")
    st.success(f"Found {len(filtered_articles)} articles")
    
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