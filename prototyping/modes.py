import streamlit as st




def progresssion_mode(): 

    st.header(f"Sentiment progression over time mode")



    if st.toggle("start uploading documents"): 

        st.write("Document 1:")

    if st.toggle("start analysis"): 

        st.write("analysis started")

    if st.toggle("export document"): 

        st.write("download PDF")

def compare_mode(): 

    st.header(f"Asset sentiment comparisson mode")
    

    
    if st.toggle("start uploading documents"): 

        st.write("Document 1:")

    if st.toggle("start analysis"): 

        st.write("analysis started")

    if st.toggle("export document"): 

        st.write("download PDF")