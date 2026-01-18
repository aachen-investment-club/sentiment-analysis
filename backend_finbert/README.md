
Run with 

RUN THIS FROM THE ROOT DIR

```sh
uvicorn backend_finbert.server:app --reload --host 127.0.0.1 --port 7575
```


in cloud run: 
- to enable traffic: 
    - security (NOT IN edit & deploy new revision; in the service desc.): 
        - authentication: allow public access
- to disable traffic:
    - security 
        - authentication: require authentication -> IAM
