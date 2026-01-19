

to build docker frontend
```sh
docker build -t benjaminoyarzun17/sentiment-frontend:prod `  --build-arg NEXT_PUBLIC_API_BASE_URL=http://18.194.92.63/api`  -f frontend/Dockerfile .


docker push benjaminoyarzun17/sentiment-frontend:prod 
```


to build docker backend
```
docker build -t benjaminoyarzun17/sentiment-backend:prod -f backend/Dockerfile .

docker push benjaminoyarzun17/sentiment-backend:prod
```