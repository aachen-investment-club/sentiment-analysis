import streamlit as st
from backend.aws_querying.DocumentData import add_article_pdf, add_article_text
from config import constants as const
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
                options=["Reuters", "Bloomberg", "WSJ", "Internal"], 
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

        title = st.text_input(
            "Article Title",
            key=f"title_{index}"
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

            if format == "text":
                if not text:
                    st.error(const.ERR_NO_TEXT)
                    return False

                add_article_text(file_date, assets, commodities, markets, source, text, title)

            else:
                if file is None:
                    st.error(const.ERR_NO_PDF)
                    return False

                add_article_pdf(file_date, assets, commodities, markets,  source, file, title)

            st.success(const.MSG_ARTICLE_SAVED)
            return True

    return False