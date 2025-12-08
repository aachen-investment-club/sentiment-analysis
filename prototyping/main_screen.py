
import streamlit as st
import sys
import os
from dotenv import load_dotenv
from modes import progression_mode, compare_mode
from config import constants as const

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)
load_dotenv()

from backend.aws_querying.DocumentData import get_document_labels

if "upload_count" not in st.session_state:
    st.session_state.upload_count = 1

if "article_labels" not in st.session_state: 
    st.session_state.article_labels = get_document_labels()


st.header(const.WELCOME_HEADER)

mode = st.selectbox(
    label = const.LABEL_SELECT_ANALYSIS_MODE, 
    options = [const.MODE_NONE, const.MODE_COMPARISON, const.MODE_PROGRESSION]
)

if mode == const.MODE_PROGRESSION: 
    progression_mode()

elif mode == const.MODE_COMPARISON: 
    compare_mode() 
