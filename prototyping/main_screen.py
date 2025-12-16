
import streamlit as st
import sys
import os
from dotenv import load_dotenv
from modes import progression_mode, compare_mode
from config import constants as const
from utils import setup_path

setup_path()
load_dotenv()

from backend.aws_querying.DocumentData import get_document_labels

if "upload_count" not in st.session_state:
    st.session_state.upload_count = 1

if "article_labels" not in st.session_state: 
    st.session_state.article_labels = get_document_labels()

if "selected_articles" not in st.session_state: 
    st.session_state.selected_articles = []


if "lower_bound_month" not in st.session_state: 
    st.session_state.lower_bound_month= None


if "lower_bound_year" not in st.session_state: 
    st.session_state.lower_bound_year= None

st.header(const.WELCOME_HEADER)

mode = st.selectbox(
    label = const.LABEL_SELECT_ANALYSIS_MODE, 
    options = [const.MODE_NONE, const.MODE_COMPARISON, const.MODE_PROGRESSION]
)

if mode == const.MODE_PROGRESSION: 
    progression_mode()

elif mode == const.MODE_COMPARISON: 
    compare_mode() 
