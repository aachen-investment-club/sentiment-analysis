import streamlit as st
from io import StringIO
from backend.aws_querying.DocumentData import add_article_pdf, add_article_text







def progresssion_mode(): 

    st.header(f"Sentiment progression over time mode")


    if st.toggle("start uploading documents"): 

        if st.button("Add another document"):
            st.session_state.upload_count += 1

        for i in range(1, st.session_state.upload_count+1):
            st.subheader(f"Document {i}")
            file_upload(i)

    st.divider()

    if st.toggle("select documents"): 

        st.write("select documents to use")

    st.divider()

    st.divider()
    if st.toggle("start analysis"): 

        st.write("analysis started")

    st.divider()
    if st.toggle("export document"): 

        st.write("download PDF")


def file_upload(index: int): 


    file_date = str(st.date_input("select the articles reference date", 
        key = f"date_input_{index}"
    ))
    assets = st.multiselect(
        "select the assets related to the file", options = ["NVDA", "NASDAQ"], 
        key = f"assets_{index}"
    )
    source = st.text_input(
        "enter the source of the file",
        key = f"source_{index}"
    )#: it might be better to make this a choice
    format = st.selectbox(
        "select format", options = ["text", "pdf"], 
        key = f"format_{index}"
        
        )
    if format == "text": 
        text = st.text_input("enter article text", 
        key = f"textinput_{index}"
                             )
    else: 

        file = st. file_uploader(
            "Choose a file", 
            key = f"uploader_{index}"
        )
        if file is not None:
            st.write("done loading file")

    if st.toggle(
            "save file",
            key = f"togglesave_{index}"
        ): 
        if format =="text": 

            add_article_text(file_date, assets, source, text)
        else: 
            add_article_pdf(file_date, assets, source, file)
        st.write(
            "file safely stored and loaded!",
            key = f"message_saved_{index}"
        )
    return True







def compare_mode(): 

    st.header(f"Asset sentiment comparisson mode")
    

    
    if st.toggle("start uploading documents"): 

        st.write("Document 1:")

    st.divider()
    if st.toggle("start analysis"): 

        st.write("analysis started")

    st.divider()
    if st.toggle("export document"): 

        st.write("download PDF")