

to build docker frontend
```sh
#docker build -t benjaminoyarzun17/sentiment-frontend:prod --build-arg NEXT_PUBLIC_API_BASE_URL="http://18.194.92.63:8000"  -f frontend/Dockerfile .
docker build -t benjaminoyarzun17/sentiment-frontend:prod -f frontend/Dockerfile .


docker push benjaminoyarzun17/sentiment-frontend:prod 
```


to build docker backend
```sh
docker build -t benjaminoyarzun17/sentiment-backend:prod -f backend/Dockerfile .

docker push benjaminoyarzun17/sentiment-backend:prod
```


in deployment usee: 
```sh
docker-compose pull
docker-compose up -d
docker-compose ps
```
to check if everything works: 
```sh
docker-compose logs -f backend
docker-compose logs -f frontend
```

to stop docker-compose: 
```sh
docker-compose stop
```


nginx: 
```sh
sudo nginx -t
sudo systemctl reload nginx
```