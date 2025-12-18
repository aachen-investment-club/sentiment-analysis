import streamlit as st
from components.article_selector import article_selection_progression_mode_filtered
from components.article_upload import file_upload
from components.sentiment_analysis_launcher import (
    launch_sentiment_analysis_progression,
    plot_dates_vs_sentiments, 
    get_vix, 
    plot_sentiment_and_vix, 
    compute_sentiment_vix_correlation
)
from config import constants as const


def render(): 

    st.header(const.PROGRESSION_MODE_HEADER)

    # Upload Step
    if st.toggle(const.PROGRESSION_MODE_UPLOAD_TOGGLE): 

        # Initialize session state for form visibility
        if "show_upload_form" not in st.session_state:
            st.session_state.show_upload_form = False
        if "upload_success" not in st.session_state:
            st.session_state.upload_success = False
        
        # Show success message if upload was successful
        if st.session_state.upload_success:
            st.success(const.MSG_ARTICLE_SAVED)
            st.session_state.upload_success = False
        
        # Button to show the upload form
        if st.button(const.BTN_ADD_DOCUMENT):
            st.session_state.show_upload_form = True
            st.rerun()
        
        # Show upload form only if user clicked the button
        if st.session_state.show_upload_form:
            st.subheader("Add Document")
            file_upload(1)

    st.divider()

    # Selection Step
    st.subheader("Select Articles for Analysis")
    st.write(const.MSG_SELECT_DOCUMENTS)
    
    # Article Selection for progression mode (starting date + optional multiple filters with intersection)
    start_analysis, selected_articles, filters = article_selection_progression_mode_filtered()

    st.divider()

    # Analysis Step
    if start_analysis and selected_articles:
        st.header("Analysis Results")
        
        with st.spinner("Running sentiment analysis..."):
            dates, sentiments = launch_sentiment_analysis_progression(
                selected_articles, 
                filters
            )
        
        # Plot sentiment progression
        plot_dates_vs_sentiments(dates, sentiments)
        
        # Show basic statistics
        if sentiments:
            avg_sentiment = sum(sentiments) / len(sentiments)
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Average Sentiment", f"{avg_sentiment:.3f}")
            with col2:
                st.metric("Article Count", len(sentiments))
            with col3:
                sentiment_label = "Positive" if avg_sentiment > 0 else "Negative" if avg_sentiment < 0 else "Neutral"
                st.metric("Overall Sentiment", sentiment_label)
        
        st.divider()
        
        # VIX Analysis (optional)
        if st.toggle("Include VIX Analysis"): 
            st.subheader("Market Volatility Comparison")
            
            with st.spinner("Fetching VIX data..."):
                vix = get_vix()
            
            # Plot sentiment vs VIX
            plot_sentiment_and_vix(dates, sentiments, vix)
            
            # Calculate and display correlation
            corr = compute_sentiment_vix_correlation(dates, sentiments, vix)
            
            st.metric(
                "Sentiment–VIX Correlation", 
                f"{corr:.3f}",
                help="Correlation between sentiment scores and VIX levels. Values range from -1 to 1."
            )
            
            # Interpretation
            if abs(corr) < 0.3:
                interpretation = "weak"
            elif abs(corr) < 0.7:
                interpretation = "moderate"
            else:
                interpretation = "strong"
            
            direction = "negative" if corr < 0 else "positive"
            
            st.info(f"There is a **{interpretation} {direction}** correlation between sentiment and VIX.")
        
        st.success("Analysis complete!")

    st.divider()

    # Export Step
    if st.toggle(const.PROGRESSION_MODE_EXPORT_TOGGLE): 
        st.write(const.MSG_EXPORT_PDF)