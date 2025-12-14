import streamlit as st
from components.article_selector import article_selection_progression_mode, article_selection_lower_bound
from components.article_upload import file_upload
from backend.pdfoutput.pdf_creation import generate_pdf
from config import constants as const

def render(): 

    st.header(const.PROGRESSION_MODE_HEADER)

    # Upload Step
    if st.toggle(const.PROGRESSION_MODE_UPLOAD_TOGGLE): 

        if st.button(const.BTN_ADD_DOCUMENT):
            st.session_state.upload_count += 1

        for i in range(1, st.session_state.upload_count+1):
            st.subheader(f"Document {i}")
            file_upload(i)

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

        pdf_bytes = generate_pdf()
        
        st.download_button(
            label="Download PDF",
            data=pdf_bytes,
            file_name="generated_report.pdf",
            mime="application/pdf"
        )
            