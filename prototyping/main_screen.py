
import streamlit as st
import sys
import os
from dotenv import load_dotenv
from modes import progression_mode, compare_mode
from config import constants as const
from utils import setup_path

setup_path()
load_dotenv()

from backend.aws_querying.DocumentData import get_document_labels



if "export_data" not in st.session_state:
    st.session_state.export_data= []


if "upload_count" not in st.session_state:
    st.session_state.upload_count = 1

if "article_labels" not in st.session_state: 
    st.session_state.article_labels = get_document_labels()

if "selected_articles" not in st.session_state: 
    st.session_state.selected_articles = []


if "lower_bound_month" not in st.session_state: 
    st.session_state.lower_bound_month= None


if "lower_bound_year" not in st.session_state: 
    st.session_state.lower_bound_year= None

# Initialize current page in session state
if "current_page" not in st.session_state:
    st.session_state.current_page = const.NAV_HOME

# ============================================================================
# SIDEBAR NAVIGATION
# ============================================================================
with st.sidebar:
    st.title("Navigation")
    
    # Home option
    if st.button(const.NAV_HOME, use_container_width=True, 
                type="primary" if st.session_state.current_page == const.NAV_HOME else "secondary"):
        st.session_state.current_page = const.NAV_HOME
        st.rerun()
    
    st.divider()
    
    # Modes section
    st.subheader(const.NAV_MODES_SECTION)
    
    if st.button(const.NAV_PROGRESSION, use_container_width=True,
                type="primary" if st.session_state.current_page == const.NAV_PROGRESSION else "secondary"):
        st.session_state.current_page = const.NAV_PROGRESSION
        st.rerun()
    
    if st.button(const.NAV_COMPARISON, use_container_width=True,
                type="primary" if st.session_state.current_page == const.NAV_COMPARISON else "secondary"):
        st.session_state.current_page = const.NAV_COMPARISON
        st.rerun()

# ============================================================================
# MAIN CONTENT AREA
# ============================================================================
# Home Page
if st.session_state.current_page == const.NAV_HOME:
    st.header(const.HOME_PAGE_HEADER)
    st.markdown(const.HOME_PAGE_DESCRIPTION)
    
    st.divider()
    
    # Quick info about modes
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        **Sentiment over time mode**
        
        Track how sentiment evolves across selected documents over time. 
        Compare sentiment trends with market volatility (VIX).
        """)
        if st.button("Go to Progression Mode", key="home_to_progression", use_container_width=True):
            st.session_state.current_page = const.NAV_PROGRESSION
            st.rerun()
    
    with col2:
        st.markdown("""
        **Asset sentiment comparison mode**
        
        Compare sentiment across different assets, markets, or commodities. 
        Analyze relative sentiment performance.
        """)
        if st.button("Go to Comparison Mode", key="home_to_comparison", use_container_width=True):
            st.session_state.current_page = const.NAV_COMPARISON
            st.rerun()
    
    st.divider()
    
    # Key Features Section
    st.subheader("Key Features")
    feature_col1, feature_col2, feature_col3 = st.columns(3)
    
    with feature_col1:
        st.info("""
        **Multi-Language Support**
        
        Analyze documents in English and German with automatic translation capabilities.
        """)
    
    with feature_col2:
        st.info("""
        **Advanced AI Models**
        
        Powered by FinBERT models specifically trained for financial text analysis.
        """)
    
    with feature_col3:
        st.info("""
        **Export & Share**
        
        Download comprehensive PDF reports with your analysis results.
        """)
    
    st.divider()
    
    # Use Cases Section
    st.subheader("What You Can Do")
    use_case_col1, use_case_col2 = st.columns(2)
    
    with use_case_col1:
        st.markdown("""
        - **Track Market Sentiment**: Monitor how sentiment changes over time for specific assets
        - **Compare Performance**: Analyze sentiment differences between multiple assets or markets
        - **VIX Correlation**: Understand the relationship between sentiment and market volatility
        """)
    
    with use_case_col2:
        st.markdown("""
        - **Document Analysis**: Upload PDFs or select from existing documents
        - **Filter & Search**: Use advanced filters to find specific articles or time periods
        - **Visual Insights**: Generate charts and visualizations of sentiment trends
        """)
    
    st.divider()
    
    # Getting Started Section
    with st.expander("Getting Started Guide", expanded=False):
        st.markdown("""
        **Step 1**: Choose an analysis mode from the sidebar or click the buttons above.
        
        **Step 2**: Upload documents or select from existing documents in the database.
        
        **Step 3**: Apply filters to narrow down your selection (dates, assets, markets, etc.).
        
        **Step 4**: Run the analysis and explore the results.
        
        **Step 5**: Export your findings as a PDF report.
        """)
    
    # Technology Info (subtle footer-like section)
    st.markdown("---")
    tech_col1, tech_col2, tech_col3 = st.columns(3)
    
    with tech_col1:
        st.caption("**Powered by**")
        st.caption("FinBERT Models")
    
    with tech_col2:
        st.caption("**Languages**")
        st.caption("English • German")
    
    with tech_col3:
        st.caption("**Analysis Types**")
        st.caption("Classification • Regression")

# Progression Mode
elif st.session_state.current_page == const.NAV_PROGRESSION:
    progression_mode()

# Comparison Mode
elif st.session_state.current_page == const.NAV_COMPARISON:
    compare_mode() 
