# Sentiment Analysis Project

This repository focuses on integrating the FinBERT model for sentiment analysis in Python. The project will eventually include:

- A FastAPI backend for serving model predictions
- A Next.js frontend for visualization

## Branch Structure

- `main` - Main branch
- `develop` - Active development branch
- `feature/finbert-integration` - Current feature branch

## Project Structure

```
sentiment-analysis/
├── backend/          # FastAPI backend (coming soon)
├── frontend/         # Next.js frontend (coming soon)
├── src/              # Source code for FinBERT integration
├── requirements.txt  # Python dependencies
└── README.md         # This file
```

## Environment Setup

This project requires Python 3.8 or higher. Choose one of the following installation methods:

### Option 1: Using Conda (Recommended for ML projects)

Conda is recommended for managing ML dependencies and provides better isolation for PyTorch and related packages.

1. Create a new conda environment:
```sh
conda create -n sentiment-analysis python=3.10
conda activate sentiment-analysis
```

2. Install PyTorch (CPU or GPU version):
   - For CPU: `conda install pytorch cpuonly -c pytorch`
   - For GPU (CUDA): `conda install pytorch pytorch-cuda=11.8 -c pytorch -c nvidia`

3. Install remaining dependencies:
```sh
pip install -r requirements.txt
```

### Option 2: Using pip + venv

1. Create a virtual environment:
```sh
python -m venv venv
```

2. Activate the virtual environment:
   - On Unix/macOS:
   ```sh
   source venv/bin/activate
   ```
   - On Windows:
   ```sh
   .\venv\Scripts\activate
   ```

3. Install dependencies:
```sh
pip install -r requirements.txt
```

## Running the FinBERT Sentiment Analysis

Once your environment is set up, you can run the FinBERT sentiment analysis script:

```sh
python src/finbert_sentiment.py
```

*(Note: Update this section once the script location and usage are finalized)*

## Backend (FastAPI) - Coming Soon

The FastAPI backend will provide REST endpoints for serving model predictions.

## Frontend (Next.js) - Coming Soon

The Next.js frontend will provide interactive visualizations for sentiment analysis results.
