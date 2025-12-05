
import streamlit as st
import sys
import os
from dotenv import load_dotenv


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)

load_dotenv()

from prototyping.modes import progresssion_mode, compare_mode
from backend.aws_querying.DocumentData import get_document_labels




if "upload_count" not in st.session_state:
    st.session_state.upload_count = 1

if "article_labels" not in st.session_state: 
    st.session_state.article_labels = get_document_labels()




PROGRESSION_MODE = "Sentiment over time mode"


COMPARE_MODE = "Asset sentiment comparisson mode" 


st.header("Welcome to AIC's sentiment analyser")




mode = st.selectbox(
    label = "Please select an analysis mode: ", 
    options = [None, COMPARE_MODE, PROGRESSION_MODE]
)

if mode== PROGRESSION_MODE: 
    progresssion_mode()


elif mode == COMPARE_MODE: 
    compare_mode() 
