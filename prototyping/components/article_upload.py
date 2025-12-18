import streamlit as st
from backend.aws_querying.DocumentData import add_article_pdf, add_article_text
from config import constants as const
from prototyping.components.sentiment_analysis_launcher import is_article_german

def file_upload(index: int):


    format = "text"
    with st.container(border=True, key=f"container_textinput_{index}"):

        st.subheader("Article Metadata")
        col1, col2 = st.columns(2)

        with col1:
            file_date = str(
                st.date_input(
                    "Reference Date",
                    key=f"date_input_{index}"
                )
            )

            source = st.selectbox(
                "Source",
                options=["Reuters", "Bloomberg", "WSJ", "Bitcoin.com News", "Internal"], 
                #:  TODO: add more sources; maybe a big list; can be 
                # discussed with the news team
                key=f"source_{index}",
            )

        with col2:
            assets = st.multiselect(
                "Related Assets",
                options=[None]+ st.session_state.article_labels["assets"], 
                key=f"assets_{index}",
            )
            commodities = st.multiselect(
                "Related Commodities",
                options=[None]+ st.session_state.article_labels["commodities"], 
                key=f"commodities_{index}",
            )
            markets= st.multiselect(
                "Related Markets",
                options=[None]+ st.session_state.article_labels["markets"], 
                key=f"markets_{index}",
            )

            format = st.selectbox(
                "Article Format",
                options=["text", "pdf"],
                key=f"format_{index}",
            )

        title_key = f"title_{index}"
        language_key = f"language_{index}"
        
        # Initialize language in session state if not exists
        if language_key not in st.session_state:
            st.session_state[language_key] = "English"
        
        title = st.text_input(
            "Article Title",
            key=title_key
        )
        
        # Auto-detect language from title and update selectbox value when title changes
        language_hint = ""
        
        # Check if title has changed (compare with previous value)
        prev_title_key = f"prev_title_{index}"
        title_changed = False
        
        if prev_title_key not in st.session_state:
            st.session_state[prev_title_key] = ""
        
        if title != st.session_state[prev_title_key]:
            title_changed = True
            st.session_state[prev_title_key] = title
        
        if title and title_changed:
            try:
                article_dict = {"title": title}
                is_german = is_article_german(article_dict)
                detected_lang = "German" if is_german else "English"
                
                # Update session state with detected language (this will update the selectbox)
                st.session_state[language_key] = detected_lang
                language_hint = f" (Auto-detected: {detected_lang})"
            except Exception:
                # If detection fails, keep current value
                language_hint = " (Auto-detection unavailable)"
        elif title:
            # Title exists but hasn't changed - show current detection status
            try:
                article_dict = {"title": title}
                is_german = is_article_german(article_dict)
                detected_lang = "German" if is_german else "English"
                if st.session_state[language_key] == detected_lang:
                    language_hint = f" (Auto-detected: {detected_lang})"
            except Exception:
                pass
        
        language = st.selectbox(
            "Language" + language_hint,
            options=["English", "German"],
            key=language_key,
            help="Language is auto-detected from the title. You can override if incorrect."
        )

        st.divider()

        st.subheader("Article Content")

        text = None
        file = None

        if format == "text":
            text = st.text_area(
                "Enter article text",
                height=180,
                key=f"textinput_{index}"
            )
        else:
            file = st.file_uploader(
                "Upload PDF file",
                type=["pdf"],
                key=f"uploader_{index}"
            )
            if file is not None:
                st.success(const.MSG_FILE_UPLOADED)

        st.divider()

        submitted = st.button("Save Article", 
                              key = f"button_upload{index}")

        if submitted:

            # Convert language selection to code format
            language_code = "en" if language == "English" else "de"

            if format == "text":
                if not text:
                    st.error(const.ERR_NO_TEXT)
                    return False

                add_article_text(file_date, assets, commodities, markets, source, text, title, language_code)

            else:
                if file is None:
                    st.error(const.ERR_NO_PDF)
                    return False

                add_article_pdf(file_date, assets, commodities, markets, source, file, title, language_code)

            # --- Reset input widgets for this index ---
            for key_suffix in ["date_input", "source", "assets", "commodities", "markets", "format", "title", "textinput", "uploader", "button_upload", "language"]:
                widget_key = f"{key_suffix}_{index}"
                if widget_key in st.session_state:
                    del st.session_state[widget_key]
            
            # Mark that upload was successful and hide form
            st.session_state.show_upload_form = False
            st.session_state.upload_success = True
            
            # Force rerun to show success message and hide form
            st.rerun()

    return True