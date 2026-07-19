# Sentiment Analysis Project

This repository integrates the FinBERT model for financial sentiment
analysis. It's made up of three services:

- A FastAPI **inference backend** (`backend_finbert/`) serving FinBERT model predictions.
- A FastAPI **API backend** (`backend/`) that authenticates users and talks to the inference backend.
- A **Next.js frontend** (`frontend/`) for visualization.

This project was developed as a tool for the News Team of AIC.

**Main contributors:**
- Benjamin Oyarzun (Developer Team Lead & Project Co-Manager)
- Kevin Ha (Project Co-Manager)
- Arash Mohamadpour (Developer Member)

**Branch structure:**
- `main` — production branch
- `develop` — active development branch
- `feature/*` — branches in development; always merge to `develop`

For the full AWS console setup (IAM roles, Lambdas, Step Functions, FinBERT
lockdown), see [`AWS_DEPLOYMENT.md`](./AWS_DEPLOYMENT.md).

---

## Architecture

In production, the frontend+backend and FinBERT run on **two separate EC2
instances** — see `AWS_DEPLOYMENT.md` for why. Locally, `docker-compose`
collapses this to three containers on one machine:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend   │────▶│   Backend   │────▶│  FinBERT     │
│  (port 3000)│     │  (port 8000)│     │  (port 8080) │
└─────────────┘     └─────────────┘     └──────────────┘
```

In production the backend never calls FinBERT directly — it invokes the
`invoke-finbert` Lambda via IAM, which is the only thing allowed to reach the
private, no-public-IP FinBERT instance. See `backend/ml/sentiment_analysis.py`
(`FINBERT_LAMBDA_NAME` env var switches between the two paths) and
`AWS_DEPLOYMENT.md` sections 3–5.

---

## Local development

### Prerequisites

Copy `.env.example` to `.env` in the project root and fill in real values —
see that file for the full list (AWS credentials, Cognito config,
`SESSION_SECRET`, etc.). `SESSION_SECRET` is required; the backend refuses to
start without it (generate one with
`python -c "import secrets; print(secrets.token_hex(32))"`).

Also copy `backend_finbert/.env.example` to `backend_finbert/.env` and set
`HF_TOKEN` (needed to download the FinBERT models from HuggingFace).

### Running everything with Docker Compose

```sh
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- FinBERT (local dev only, mapped from container port 8080): http://localhost:7575

### Running services individually

**Inference backend (FinBERT)** — from the project root:
```sh
uvicorn backend_finbert.server:app --reload --host 127.0.0.1 --port 7575
```

**API backend** — must run from the project root, not from inside `backend/`,
since it uses absolute imports (`from backend.api.routes import articles`):
```sh
uvicorn backend.main:app --reload
```
Available at http://localhost:8000 — interactive docs at `/docs` (Swagger UI)
and `/redoc` (ReDoc).

**Frontend**:
```sh
cd frontend && pnpm dev
```
Available at http://localhost:3000.

### Prototyping UI (Streamlit)

A standalone Streamlit prototype lives at `prototyping/main_screen.py`, useful
for quick experiments outside the full frontend/backend stack:
```sh
streamlit run prototyping/main_screen.py
```
It reads the same root `.env` for AWS credentials.

---

## Backend API reference

### Project structure

```
backend/
├── main.py                    # FastAPI application entry point, auth routes
├── api/
│   ├── routes/                # API route handlers (articles.py, progression.py)
│   └── utils.py
├── ml/
│   ├── preprocessing.py       # PDF text extraction and cleaning
│   ├── sentiment_analysis.py  # Main sentiment analysis pipeline (local HTTP or invoke-finbert Lambda)
│   └── language_detection.py
├── aws_querying/
│   └── DocumentData.py        # DynamoDB + S3 document data handling
└── requirements.txt
```

### `GET /api/articles`

Returns all articles from DynamoDB.

```json
[
  {
    "DocumentID": "uuid-string",
    "title": "Article Title",
    "date": "2024-01-15",
    "source": "Reuters",
    "assets": ["BTC", "ETH"],
    "commodities": ["Gold"],
    "markets": ["Crypto", "US"],
    "file_name": "uuid-string.txt",
    "language": "en"
  }
]
```

Status codes: `200` success, `500` server/database error.

---

## Building & pushing images

**Current source of truth is `docker-compose.yml`**, which pulls from ECR:

```sh
# Backend
docker build -t <account-id>.dkr.ecr.eu-central-1.amazonaws.com/sentiment-analysis-backend:latest -f backend/Dockerfile .
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/sentiment-analysis-backend:latest

# Frontend
docker build -t <account-id>.dkr.ecr.eu-central-1.amazonaws.com/sentiment-analysis-frontend:latest \
  --build-arg NEXT_PUBLIC_API_BASE_URL=<your-backend-url> -f frontend/Dockerfile .
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/sentiment-analysis-frontend:latest

# FinBERT (root Dockerfile — builds backend_finbert/server.py)
docker build -t <account-id>.dkr.ecr.eu-central-1.amazonaws.com/sentiment-analysis-finbert:latest -f Dockerfile .
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/sentiment-analysis-finbert:latest
```

**Note:** older working notes referenced a different registry/naming scheme
(Docker Hub, `benjaminoyarzun17/sentiment-*:prod`) and a slightly different
ECR naming (`sentiment-backend`/`sentiment-frontend` without the
`-analysis` suffix, tag `:prod`). If you're picking this project back up,
confirm which one is actually current before trusting either — `docker-compose.yml`
is the most reliable source since it's what's actually pulled at runtime.

### Deploying on the frontend+backend instance

```sh
docker-compose pull
docker-compose up -d
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose stop
```

If nginx sits in front of the app on that instance:
```sh
sudo nginx -t
sudo systemctl reload nginx
```

### Deploying the FinBERT instance

See `AWS_DEPLOYMENT.md` section 3c — it's a single container (`docker run`,
not `docker-compose`), built from the root `Dockerfile`, on its own private
EC2 instance.

---

## EC2 auto-start/stop lifecycle

The `aws/` directory manages the frontend+backend instance's lifecycle so it
isn't billed 24/7:

- [`aws/lambda/start_instance.py`](./aws/lambda/start_instance.py) — starts the instance, returns the frontend URL
- [`aws/lambda/shutdown_instance.py`](./aws/lambda/shutdown_instance.py) — stops it
- [`aws/step-functions/ec2-lifecycle.json`](./aws/step-functions/ec2-lifecycle.json) — invokes start, waits 3 hours, invokes stop
- [`aws/iam/start-instance-policy.json`](./aws/iam/start-instance-policy.json), [`aws/iam/stop-instance-policy.json`](./aws/iam/stop-instance-policy.json) — least-privilege IAM for each Lambda's role, scoped to this instance only

Full console setup: `AWS_DEPLOYMENT.md` section 7.

**Status:**
- Done: Lambda code, IAM policies (scoped, least-privilege), Step Functions definition, FinBERT lockdown (security groups, SSM access, IAM), backend's IAM policies.
- Still open: nothing triggers the Step Functions execution yet (no DNS/API Gateway/Function URL wired up) — see `AWS_DEPLOYMENT.md`'s "Known gap" note. Also worth resolving: `buildspec.yml` (CodeBuild) and `.github/workflows/deploy-lambdas.yml` (GitHub Actions) both deploy the same two Lambdas — confirm only one is actually active before relying on either.
