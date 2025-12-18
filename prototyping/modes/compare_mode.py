import streamlit as st
from components.article_upload import file_upload
from components.article_selector import article_selection_compare_mode
from components.sentiment_analysis_launcher import launch_sentiment_analysis_comparison
from config import constants as const
from backend.pdfoutput.pdf_creation import generate_pdf

def render(): 
    st.header(const.COMPARE_MODE_HEADER)
    
    # Upload Step
    if st.toggle(const.COMPARE_MODE_UPLOAD_TOGGLE): 
        
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
    st.subheader("Select Articles for Comparison")
    st.write(const.MSG_SELECT_DOCUMENTS)
    
    # Article Selection according to Compare mode
    start_analysis, selected_articles, filters = article_selection_compare_mode()

    st.divider()

    # Analysis Step
    if start_analysis and selected_articles:
        st.header("Analysis Results")
        
        # Check if any filters were selected
        if not filters:
            st.warning("No comparison filters selected. Please select at least one asset, market, or commodity to compare.")
        else:
            launch_sentiment_analysis_comparison(selected_articles, filters)
            
            st.success("Analysis complete!")

    st.divider()

    # Export Step
    if st.toggle(const.COMPARE_MODE_EXPORT_TOGGLE): 
        pdf_bytes = generate_pdf(st.session_state.export_data)
        
        st.download_button(
            label="Download PDF",
            data=pdf_bytes,
            file_name="generated_report.pdf",
            mime="application/pdf"
        )