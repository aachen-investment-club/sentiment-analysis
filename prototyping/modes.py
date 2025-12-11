import streamlit as st
from io import StringIO
from backend.aws_querying.DocumentData import add_article_pdf, add_article_text, list_articles, get_articles_s3
from backend.ml.sentiment_analysis import sentiment_analysis_text
from typing import List





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
        article_selection()
        


    st.divider()
    if st.toggle("start analysis"): 

        st.write("analysis started")
        get_articles()

    st.divider()
    if st.toggle("export document"): 

        st.write("download PDF")




def get_articles() : 
    articles = st.session_state.selected_articles
    articles = get_articles_s3(articles)

    st.write(articles)

    run_finbert(articles)


def run_finbert(files): 

    overall_results = {}
    for file, text in files.items(): 
        overall_sentiment, confidence, results = sentiment_analysis_text(
            text,  
            german = False, 
            regression = False
        )
        overall_results[file]= {
            "sentiment": overall_sentiment, 
            "confidence": confidence, 
            "results": results
        } 

    st.write(overall_results)






    







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
                options=["Handelsblatt", "Euro", 
                         "Tagesschau", "", 
                         "Statistisches Bundesamt", "Die Zeit", 
                         "Other", "Eurostat", 
                         "FAZ", "ZDF", "Federal Reserve"
                         "Spiegel", 
                         "Reuters", "Bloomberg", "WSJ", "Internal"], 
                #:  TODO: add more sources; maybe a big list; can be 
                # discussed with the news team
                key=f"source_{index}",
            )
            assets = st.multiselect(
                "Language",
                options=["English", "German"], 
                key=f"language_{index}",
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
                st.success("File uploaded successfully.")

        st.divider()

        submitted = st.button("Save Article", 
                              key = f"button_upload{index}")

        if submitted:

            if format == "text":
                if not text:
                    st.error("Please enter article text before saving.")
                    return False

                add_article_text(file_date, assets, commodities, markets, source, text, title)

            else:
                if file is None:
                    st.error("Please upload a PDF file before saving.")
                    return False

                add_article_pdf(file_date, assets, commodities, markets,  source, file, title)

            st.success("Article successfully saved!")
            return True

    return False




def article_selection(): 

    articles = list_articles()

    st.session_state.selected_articles = []
    for article in articles: 
        with st.container(border = True): 
            col1, col2 = st.columns([0.9,0.1])
            checked = col2.checkbox ("", key = article["DocumentID"])
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
            st.session_state.selected_articles.append(article["file_name"])

    if st.toggle("Commit selection"): 
        st.write(f"selected articles: {st.session_state.selected_articles}")



    # TODO: the part where the documents are fetched for analysis should be executed when 
    # the analysis is started 





def compare_mode(): 

    st.header(f"Asset sentiment comparisson mode")
    

    
    if st.toggle("start uploading documents"): 

        st.write("Document 1:")

    st.divider()
    
    if st.toggle("start selecting documents"): 
        pass

    st.divider()
    if st.toggle("start analysis"): 

        st.write("analysis started")

    st.divider()
    if st.toggle("export document"): 

        st.write("download PDF")