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


## Docker Deployment

### Architecture
```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend   │────▶│   Backend   │────▶│  FinBERT     │
│  (port 3000)│     │  (port 8000)│     │  (port 8080) │
└─────────────┘     └─────────────┘     └──────────────┘
```

### Running with Docker Compose

```sh
# Build and start all services
docker-compose up --build

# Services:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - FinBERT: http://localhost:7575 (mapped to container port 8080)
```

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


## AWS Deployment

### ECR Images

Build and push images to ECR:

```sh
# Build finbert image
docker build -t <account-id>.dkr.ecr.<region>.amazonaws.com/sentiment-finbert:prod -f Dockerfile .

# Build backend image
docker build -t <account-id>.dkr.ecr.<region>.amazonaws.com/sentiment-backend:prod -f backend/Dockerfile .

# Build frontend image
docker build -t <account-id>.dkr.ecr.<region>.amazonaws.com/sentiment-frontend:prod -f frontend/Dockerfile .
```

### EC2 Auto-Start/Stop with Lambda

The `aws/` directory contains Lambda functions for managing EC2 instance lifecycle:

- [`aws/lambda/start_instance.py`](./aws/lambda/start_instance.py) - Starts EC2 and returns frontend URL
- [`aws/lambda/shutdown_instance.py`](./aws/lambda/shutdown_instance.py) - Stops EC2 instance
- [`aws/iam/lambda-ec2-policy.json`](./aws/iam/lambda-ec2-policy.json) - IAM policy for Lambda
- [`aws/step-functions/ec2-lifecycle.json`](./aws/step-functions/ec2-lifecycle.json) - Step Functions state machine

#### Setup Steps

1. **Create IAM Role** for Lambda with the policy in `aws/iam/lambda-ec2-policy.json`

2. **Deploy Lambda Functions**:
   - Create Lambda function with `start_instance.py` code
   - Create Lambda function with `shutdown_instance.py` code
   - Set environment variable `INSTANCE_ID` to your EC2 instance ID

3. **Create API Gateway**:
   - REST API with POST `/start` endpoint
   - Integrate with start_instance Lambda
   - Enable CORS

4. **Set up Step Functions** (optional):
   - Create state machine using `ec2-lifecycle.json`
   - This provides a 3-hour delay before shutdown

5. **Configure EC2**:
   - Launch EC2 instance with Docker installed
   - Deploy the application using docker-compose
   - Ensure security group allows ports 3000, 8000, 7575

#### What's Done
- ✅ Lambda function code created
- ✅ IAM policy created
- ✅ Step Functions state machine definition created

#### What Needs to Be Done
- ⬜ Create IAM role in AWS console
- ⬜ Deploy Lambda functions to AWS
- ⬜ Create API Gateway and connect to start Lambda
- ⬜ Set up Step Functions state machine (or CloudWatch Events for timer)
- ⬜ Launch and configure EC2 instance
- ⬜ Update instance ID in Lambda functions


