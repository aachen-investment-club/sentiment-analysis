from fastapi import Depends, FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.responses import HTMLResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from authlib.integrations.base_client.errors import OAuthError

import os
import urllib
load_dotenv()


COGNITO_DOMAIN_PREFIX = os.getenv("COGNITO_DOMAIN_PREFIX")
COGNITO_REGION = os.getenv("AWS_REGION")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")

SESSION_SECRET = os.getenv("SESSION_SECRET")
if not SESSION_SECRET:
    raise RuntimeError(
        "SESSION_SECRET environment variable must be set to a random secret "
        "value - it signs the session cookies used for authentication and "
        "must never be hardcoded or left at a default. Generate one with: "
        "python -c \"import secrets; print(secrets.token_hex(32))\""
    )





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
    secret_key=SESSION_SECRET,
    same_site="lax",
    https_only=True,  # set True if you test over https
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
auth_router = APIRouter(prefix="/api", tags=["auth"])

# Include routers
app.include_router(articles.router)
app.include_router(progression.router)



oauth = OAuth()

# Get client secret - may be None for public clients
client_secret = os.getenv("AWS_COGNITO_CLIENT_SECRET")


# Register OAuth client
_cognito_issuer = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
oauth_config = {
    "name": "oidc",
    "authority": _cognito_issuer,
    "client_id": os.getenv("COGNITO_CLIENT_ID"),
    "server_metadata_url": f"{_cognito_issuer}/.well-known/openid-configuration",
    "client_kwargs": {"scope": "email openid"},
}

# Only add client_secret if it exists (for confidential clients)
if client_secret:
    oauth_config["client_secret"] = client_secret

oauth.register(**oauth_config)



@auth_router.get("/login")
async def login(request: Request):
    
    redirect_uri = str(request.url_for("authorize"))
    print("auth url:")
    print(redirect_uri)
    return await oauth.oidc.authorize_redirect(request, redirect_uri)



@auth_router.get("/authorize")
async def authorize(request: Request):
    try:
        token = await oauth.oidc.authorize_access_token(request)
        user = token["userinfo"]
        request.session["user"] = user
        
        # Redirect to frontend after successful authentication
        frontend_url = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

        print("frontend_origin")
        print(frontend_url)
        return RedirectResponse(url=frontend_url, status_code=302)
    except OAuthError as e:
        # THIS is what you need to see in logs
        print("OAUTH ERROR:", e.error, e.description)

        frontend_url = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
        return RedirectResponse(
            url=f"{frontend_url}?auth_error=true&error={e.error}",
            status_code=302
        )
    except Exception as e:        
        # Redirect to frontend with error
        frontend_url = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}?auth_error=true&reason={type(e).__name__}", status_code=302)


@auth_router.get("/logout")
async def logout(request: Request):
    # Clear the app session so our backend no longer considers the user logged in.
    request.session.pop("user", None)

    # Redirect to Cognito's logout endpoint so the IdP session and cookies are cleared.
    # Otherwise the user can "log in" again without entering credentials (Cognito still has a session).
    # Cognito app client's "Allowed sign-out URLs" or Cognito will not redirect back.
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    logout_uri = frontend_origin.rstrip("/") + "/"
    print("frontend_origin")
    print(logout_uri)
    params = {
        "client_id": COGNITO_CLIENT_ID,
        "logout_uri": logout_uri,
    }
    qs = urllib.parse.urlencode(params)
    cognito_domain = os.getenv("COGNITO_DOMAIN_PREFIX", "")
    cognito_region = os.getenv("AWS_REGION", "eu-central-1")
    if cognito_domain:
        cognito_logout_url = f"https://{cognito_domain}.auth.{cognito_region}.amazoncognito.com/logout?{qs}"
        return RedirectResponse(url=cognito_logout_url, status_code=302)
    # If no Cognito domain is configured, just send user to frontend.
    return RedirectResponse(url=logout_uri, status_code=302)


@auth_router.get("/user")
async def get_user(current_user: dict = Depends(get_current_user)):
    """Return the current session user or 401 if not authenticated."""
    return current_user


app.include_router(auth_router)


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

