# Sentiment Analysis Project

This repository focuses on integrating the FinBERT model for sentiment analysis in Python. The project will eventually include:

- A FastAPI backend for serving model predictions (inference backend).
- A FastAPI backend for the frontend that communicates with the inference backend.
- A Next.js frontend for visualization

This project was developed as a tool for the News Team of AIC.

# Main Contributors: 
- Benjamin Oyarzun (Developer Team Lead & Project Co-Manager)
- Kevin Ha (Project Co-Manager)
- Arash Mohamadpour (Developer Member)


## Branch Structure

- `main` - Main branch; production branch. 
- `develop` - Active development branch
- `feature/` - branch currently in development. PLEASE ALWAS MERGE TO DEVELOP.


### Running (inference backend)

```sh
# From the project root 
uvicorn backend_finbert.server:app --reload --host 127.0.0.1 --port 7575
```


### Running (API backend)

```sh
# From the project root 
uvicorn backend.main:app --reload
```




### Running (frontend)

1. Run the development server:
```sh
pnpm dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)


