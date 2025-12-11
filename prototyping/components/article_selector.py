import streamlit as st
from utils import setup_path
setup_path()
from backend.aws_querying.DocumentData import list_articles

def article_selection(): 

    articles = list_articles()
    selection = []
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
            selection.append(article["DocumentID"])

    if st.toggle("Commit selection"): 
        st.write(f"selected articles: {selection}")

    # TODO: the part where the documents are fetched for analysis should be executed when 
    # the analysis is started 

