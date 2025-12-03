
import streamlit as st
import sys
import os


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)
from prototyping.modes import progresssion_mode, compare_mode



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
