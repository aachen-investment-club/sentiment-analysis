
import streamlit as st


import sys
import os


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)


from backend.ml.sentiment_analysis import sentiment_analysis


import pandas as pd



#: run this with (venv) PS C:\Users\benja\Escritorio\sentiment-analysis> streamlit run prototyping/test.py                        
#: from the root folder








st.write("hellow world")



df = pd.DataFrame({
  'first column': [1, 2, 3, 4],
  'second column': [10, 20, 30, 40]
})
inp = st.text_input("input something")



st.write(inp)



#"There is a shortage of capital, and we need extra financing. The future growth is strong and we have plenty of liquidity":

st.write(sentiment_analysis(inp))





st.write(df)

