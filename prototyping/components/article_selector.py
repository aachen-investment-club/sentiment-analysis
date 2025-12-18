import streamlit as st
from datetime import datetime
from typing import Dict, List, Tuple
from utils import setup_path
setup_path()
from backend.aws_querying.DocumentData import list_articles

def article_selection_progression_mode(): 
    articles = list_articles()
    selection = []
    for article in articles: 
        with st.container(border = True): 
            col1, col2 = st.columns([0.9,0.1])
            checked = col2.checkbox ("", key = article)
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
            selection.append(article)

    if st.toggle("Commit selection"): 
        st.write(f"selected articles: {selection}")
        return selection
    
    return []

def article_selection_compare_mode() -> Tuple[bool, List, Dict]:
    """
    Returns: (start_analysis: bool, filtered_articles: List, filters: Dict)
    """
    articles = list_articles()
    
    # Collect available options
    available_years = set()
    available_months = set()
    available_assets = set()
    available_markets = set()
    available_commodities = set()
    
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')
            available_years.add(article_date.year)
            available_months.add(article_date.month)
            available_assets = available_assets.union(set(article["assets"]))
            available_markets = available_markets.union(set(article["markets"]))
            available_commodities = available_commodities.union(set(article["commodities"]))
        except (ValueError, KeyError):
            continue
    
    available_years = sorted(list(available_years), reverse=True)
    available_months = sorted(list(available_months))
    available_assets = sorted(list(available_assets))
    available_markets = sorted(list(available_markets))
    available_commodities = sorted(list(available_commodities))
    
    # Date Range Selection
    st.subheader("Select Date Range")
    
    if not available_years or not available_months:
        st.warning("No articles with valid dates found.")
        return False, [], {}
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**Start Date**")
        start_year = st.selectbox(
            "Year",
            options=available_years,
            key="start_year"
        )
        start_month = st.selectbox(
            "Month",
            options=available_months,
            format_func=lambda x: datetime(2000, x, 1).strftime('%B'),
            key="start_month"
        )
    
    with col2:
        st.markdown("**End Date**")
        end_year = st.selectbox(
            "Year",
            options=available_years,
            key="end_year"
        )
        end_month = st.selectbox(
            "Month",
            options=available_months,
            format_func=lambda x: datetime(2000, x, 1).strftime('%B'),
            key="end_month"
        )
    
    # Filter Selection
    st.subheader("Select Filters (optional)")
    
    filters = {}
    
    selected_assets = st.multiselect(
        "Select assets to compare",
        options=available_assets,
    )
    if selected_assets:
        filters['assets'] = selected_assets
    
    selected_markets = st.multiselect(
        "Select markets to compare",
        options=available_markets,
    )
    if selected_markets:
        filters['markets'] = selected_markets
    
    selected_commodities = st.multiselect(
        "Select commodities to compare",
        options=available_commodities,
    )
    if selected_commodities:
        filters['commodities'] = selected_commodities
    
    # Validate date range
    start_date = datetime(start_year, start_month, 1)
    end_date = datetime(end_year, end_month, 1)
    
    if start_date > end_date:
        st.error("Start date must be before or equal to end date!")
        return False, [], {}
    
    # Filter articles by date range and tags
    filtered_articles = []
    filtered_titles_set = set()
    
    selected_assets_set = set(selected_assets)
    selected_markets_set = set(selected_markets)
    selected_commodities_set = set(selected_commodities)
    
    # If no filters selected, get all articles in date range
    any_filter_selected = selected_assets or selected_markets or selected_commodities
    
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')
            
            # Check date range
            if not (start_date <= article_date <= end_date):
                continue
            
            # Check filters if any are selected
            if any_filter_selected:
                article_assets = set(article.get("assets", []))
                article_markets = set(article.get("markets", []))
                article_commodities = set(article.get("commodities", []))
                
                has_matching_tag = (
                    (not article_assets.isdisjoint(selected_assets_set)) or
                    (not article_markets.isdisjoint(selected_markets_set)) or
                    (not article_commodities.isdisjoint(selected_commodities_set))
                )
                
                if not has_matching_tag:
                    continue
            
            # Add article (avoid duplicates by title)
            if article["title"] not in filtered_titles_set:
                filtered_articles.append(article)
                filtered_titles_set.add(article["title"])
                
        except (ValueError, KeyError):
            continue
    
    # Display info
    st.info(f"Date range: {start_month}/{start_year} to {end_month}/{end_year}")
    st.success(f"Found {len(filtered_articles)} articles")
    
    if filters:
        st.write("**Active filters:**")
        if 'assets' in filters:
            st.write(f"- Assets: {', '.join(filters['assets'])}")
        if 'markets' in filters:
            st.write(f"- Markets: {', '.join(filters['markets'])}")
        if 'commodities' in filters:
            st.write(f"- Commodities: {', '.join(filters['commodities'])}")
    
    # Start analysis button
    if st.button("Start Analysis", type="primary"):
        if not filtered_articles:
            st.error("No articles found with the selected criteria!")
            return False, [], {}
        return True, filtered_articles, filters
    
    return False, [], {}

def article_selection_progression_mode_filtered() -> Tuple[bool, List, Dict]:
    """
    Progression mode: Starting date + optional multiple filters with INTERSECTION logic
    Articles must match ALL selected filter categories (if selected)
    Returns: (start_analysis: bool, filtered_articles: List, filters: Dict)
    """
    articles = list_articles()
    
    # Collect available options
    available_years = set()
    available_months = set()
    available_assets = set()
    available_markets = set()
    available_commodities = set()
    
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')
            available_years.add(article_date.year)
            available_months.add(article_date.month)
            available_assets = available_assets.union(set(article["assets"]))
            available_markets = available_markets.union(set(article["markets"]))
            available_commodities = available_commodities.union(set(article["commodities"]))
        except (ValueError, KeyError):
            continue
    
    available_years = sorted(list(available_years), reverse=True)
    available_months = sorted(list(available_months))
    available_assets = sorted(list(available_assets))
    available_markets = sorted(list(available_markets))
    available_commodities = sorted(list(available_commodities))
    
    # Starting Date Selection
    st.subheader("Select Starting Date")
    
    if not available_years or not available_months:
        st.warning("No articles with valid dates found.")
        return False, [], {}
    
    col1, col2 = st.columns(2)
    
    with col1:
        start_year = st.selectbox(
            "Starting Year",
            options=available_years,
            key="prog_start_year"
        )
    
    with col2:
        start_month = st.selectbox(
            "Starting Month",
            options=available_months,
            format_func=lambda x: datetime(2000, x, 1).strftime('%B'),
            key="prog_start_month"
        )
    
    # Store in session state for VIX
    st.session_state.lower_bound_year = start_year
    st.session_state.lower_bound_month = start_month
    
    # Optional Filter Selection (multiple with intersection)
    st.subheader("Select Filters (optional)")
    st.info("Articles must match ALL selected filter categories. Within each category, an article matches if it has ANY of the selected values.")
    
    filters = {}
    
    selected_assets = st.multiselect(
        "Select assets (optional)",
        options=available_assets,
        key="prog_assets"
    )
    if selected_assets:
        filters['assets'] = selected_assets
    
    selected_markets = st.multiselect(
        "Select markets (optional)",
        options=available_markets,
        key="prog_markets"
    )
    if selected_markets:
        filters['markets'] = selected_markets
    
    selected_commodities = st.multiselect(
        "Select commodities (optional)",
        options=available_commodities,
        key="prog_commodities"
    )
    if selected_commodities:
        filters['commodities'] = selected_commodities
    
    # Filter articles with INTERSECTION logic
    start_date = datetime(start_year, start_month, 1)
    
    filtered_articles = []
    filtered_titles_set = set()
    
    selected_assets_set = set(selected_assets)
    selected_markets_set = set(selected_markets)
    selected_commodities_set = set(selected_commodities)
    
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')
            
            # Check date range
            if article_date < start_date:
                continue
            
            # INTERSECTION logic: article must match ALL selected filter categories
            article_assets = set(article.get("assets", []))
            article_markets = set(article.get("markets", []))
            article_commodities = set(article.get("commodities", []))
            
            # If assets filter is selected, article must have at least one of the selected assets
            if selected_assets_set and article_assets.isdisjoint(selected_assets_set):
                continue
            
            # If markets filter is selected, article must have at least one of the selected markets
            if selected_markets_set and article_markets.isdisjoint(selected_markets_set):
                continue
            
            # If commodities filter is selected, article must have at least one of the selected commodities
            if selected_commodities_set and article_commodities.isdisjoint(selected_commodities_set):
                continue
            
            # Add article (avoid duplicates by title)
            if article["title"] not in filtered_titles_set:
                filtered_articles.append(article)
                filtered_titles_set.add(article["title"])
                
        except (ValueError, KeyError):
            continue
    
    # Display info
    st.info(f"Articles starting from {start_month}/{start_year}")
    
    if filters:
        st.write("**Active filters (ALL must match):**")
        if 'assets' in filters:
            st.write(f"- Assets: {', '.join(filters['assets'])} (article must have at least one)")
        if 'markets' in filters:
            st.write(f"- Markets: {', '.join(filters['markets'])} (article must have at least one)")
        if 'commodities' in filters:
            st.write(f"- Commodities: {', '.join(filters['commodities'])} (article must have at least one)")
    
    st.success(f"Found {len(filtered_articles)} articles")
    
    # Start analysis button
    if st.button("Start Analysis", type="primary", key="prog_start_btn"):
        if not filtered_articles:
            st.error("No articles found with the selected criteria!")
            return False, [], {}
        return True, filtered_articles, filters
    
    return False, [], {}

def article_selection_lower_bound(): 
    articles = list_articles()
    
    available_years = set()
    available_months = set()
    
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')
            available_years.add(article_date.year)
            available_months.add(article_date.month)
        except (ValueError, KeyError):
            continue
    
    available_years = sorted(list(available_years), reverse=True)
    available_months = sorted(list(available_months))
    
    st.subheader("Filter by Date")
    
    if not available_years or not available_months:
        st.warning("No articles with valid dates found.")
        return []
    
    selected_year = st.selectbox(
        "Select Starting Year",
        options=available_years,
    )
    selected_month = st.selectbox(
        "Select Starting Month",
        options=available_months,
        format_func=lambda x: datetime(2000, x, 1).strftime('%B'),
    )
    st.session_state.lower_bound_year = selected_year 
    st.session_state.lower_bound_month = selected_month
    
    if not selected_year or not selected_month:
        st.warning("Please select at least one year and one month to filter articles.")
        return []
    
    lower_bound = datetime(selected_year, selected_month, 1)

    filtered_articles = []
    for article in articles:
        try:
            article_date = datetime.strptime(article['date'], '%Y-%m-%d')  

            if article_date >= lower_bound:
                filtered_articles.append(article)

        except (ValueError, KeyError):
            continue
    
    st.info(f"Filtering: articles starting from {selected_month} in year {selected_year}")
    st.success(f"Found {len(filtered_articles)} articles")
    
    selection = []
    for article in filtered_articles: 
        with st.container(border=True): 
            col1, col2 = st.columns([0.9, 0.1])
            checked = col2.checkbox("", key=article)
            
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
                selection.append(article)

    if st.toggle("Commit selection"): 
        st.write(f"Selected articles: {selection}")
        return selection
    
    return []