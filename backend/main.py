from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.responses import HTMLResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
import os
import urllib
load_dotenv()


COGNITO_DOMAIN_PREFIX = os.getenv("COGNITO_DOMAIN_PREFIX")  
COGNITO_REGION = os.getenv("AWS_REGION")   
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")





app = FastAPI(
    title="Sentiment Analysis API",
    description="API for financial sentiment analysis using FinBERT",
    version="1.0.0",
)

# CORS middleware configuration
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-secret-change-me"),  # for testing only
    same_site="lax",
    https_only=False,  # set True if you test over https
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



oauth = OAuth()


oauth.register(
    name="oidc",
    authority="https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_8uVOcPO1T",
    client_id=os.getenv("COGNITO_CLIENT_ID"),
    client_secret=os.getenv("AWS_COGNI_CLIENT_SECRET"),
    server_metadata_url="https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_8uVOcPO1T/.well-known/openid-configuration",
    client_kwargs={"scope": "email openid"},
)



@app.get("/login")
async def login(request: Request):
    
    redirect_uri = str(request.url_for("authorize"))
    return await oauth.oidc.authorize_redirect(request, redirect_uri)



@app.get("/authorize")
async def authorize(request: Request):
    token = await oauth.oidc.authorize_access_token(request)
    user = token["userinfo"]
    request.session["user"] = user
    return RedirectResponse(url="/", status_code=302)


@app.get("/logout")
async def logout(request: Request):

    request.session.pop('user', None)

    logout_uri = request.url_for("root")

    params = {
        "client_id": COGNITO_CLIENT_ID,
        "logout_uri": logout_uri,  
    }
    qs = urllib.parse.urlencode(params)

    cognito_logout = f"https://{COGNITO_DOMAIN_PREFIX}.auth.{COGNITO_REGION}.amazoncognito.com/logout?{qs}"


    return RedirectResponse(cognito_logout) 






@app.get("/")
async def root():
    """Root endpoint to verify API is running."""
    return {
        "message": "Sentiment Analysis API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

