import streamlit as st
from io import StringIO
from backend.aws_querying.DocumentData import add_article_pdf, add_article_text



def progresssion_mode(): 

    st.header(f"Sentiment progression over time mode")


    if st.toggle("start uploading documents"): 
        counter = 1


        file_upload(counter)


    if st.toggle("start analysis"): 

        st.write("analysis started")

    if st.toggle("export document"): 

        st.write("download PDF")


def file_upload(index: int): 

    st.write(f"Document {index}:")

    file_date = str(st.date_input("select the articles reference date"))
    assets = st.multiselect("select the assets related to the file", options = ["NVDA", "NASDAQ"])
    source = st.text_input("enter the source of the file")#: it might be better to make this a choice
    format = st.selectbox("select format", options = ["text", "pdf"])
    if format == "text": 
        text = st.text_input("enter article text")
    else: 

        file = st. file_uploader("Choose a file")
        if file is not None:
            st.write("done loading file")

    if st.toggle("save file"): 
        if format =="text": 

            add_article_text(file_date, assets, source, text)
        else: 
            add_article_pdf(file_date, assets, source, file)
        st.write("file safely stored and loaded!")
    return True







def compare_mode(): 

    st.header(f"Asset sentiment comparisson mode")
    

    
    if st.toggle("start uploading documents"): 

        st.write("Document 1:")

    if st.toggle("start analysis"): 

        st.write("analysis started")

    if st.toggle("export document"): 

        st.write("download PDF")