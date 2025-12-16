import streamlit as st
from components.article_selector import article_selection_progression_mode, article_selection_lower_bound
from components.article_upload import file_upload
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
    if st.toggle(const.PROGRESSION_MODE_SELECT_TOGGLE): 

        st.write(const.MSG_SELECT_DOCUMENTS)
        #article_selection_progression_mode()
        article_selection_lower_bound()


    st.divider()

    # Analysis Step
    if st.toggle(const.PROGRESSION_MODE_ANALYSIS_TOGGLE): 

        st.write(const.MSG_ANALYSIS_STARTED)

    st.divider()

    # Export Step
    if st.toggle(const.PROGRESSION_MODE_EXPORT_TOGGLE): 

        st.write(const.MSG_EXPORT_PDF)
            