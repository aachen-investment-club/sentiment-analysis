import sys
import os

def setup_path():
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if ROOT_DIR not in sys.path:
        sys.path.append(ROOT_DIR)