from fastapi import Depends, FastAPI, Request
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





from backend.api.deps import get_current_user
from backend.api.routes import articles
from backend.api.routes import progression 
import os

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
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(articles.router)
app.include_router(progression.router)



oauth = OAuth()

# Get client secret - may be None for public clients
client_secret = os.getenv("AWS_COGNITO_CLIENT_SECRET")


# Register OAuth client
oauth_config = {
    "name": "oidc",
    "authority": "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_8uVOcPO1T",
    "client_id": os.getenv("COGNITO_CLIENT_ID"),
    "server_metadata_url": "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_8uVOcPO1T/.well-known/openid-configuration",
    "client_kwargs": {"scope": "email openid"},
}

# Only add client_secret if it exists (for confidential clients)
if client_secret:
    oauth_config["client_secret"] = client_secret

oauth.register(**oauth_config)



@app.get("/login")
async def login(request: Request):
    
    redirect_uri = str(request.url_for("authorize"))
    return await oauth.oidc.authorize_redirect(request, redirect_uri)



@app.get("/authorize")
async def authorize(request: Request):
    try:
        token = await oauth.oidc.authorize_access_token(request)
        user = token["userinfo"]
        request.session["user"] = user
        
        # Redirect to frontend after successful authentication
        frontend_url = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
        return RedirectResponse(url=frontend_url, status_code=302)
    except Exception as e:        
        # Redirect to frontend with error
        frontend_url = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}?auth_error=true&reason={type(e).__name__}", status_code=302)


@app.get("/logout")
async def logout(request: Request):
    # Clear the app session
    request.session.pop('user', None)

    # Redirect directly to frontend root so the user always lands on the main page.
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    frontend_root = frontend_origin.rstrip("/") + "/"
    return RedirectResponse(url=frontend_root, status_code=302)


@app.get("/user")
async def get_user(current_user: dict = Depends(get_current_user)):
    """Return the current session user or 401 if not authenticated."""
    return current_user




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

