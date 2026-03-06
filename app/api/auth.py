"""OAuth 2.0 authentication routes — Google and GitHub providers.

Flow:
  GET /auth/{provider}          → redirect to provider consent page
  GET /auth/{provider}/callback → exchange code, upsert user, set JWT cookie
  GET /auth/me                  → return current user from JWT cookie
  POST /auth/logout             → clear session cookie
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models.user import User
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Config ────────────────────────────────────────────────────────────────────
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30

def _cfg():
    return get_settings()


def create_jwt(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name or "",
        "avatar_url": user.avatar_url or "",
        "provider": user.provider or "",
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, _cfg().jwt_secret, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="archon_session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=JWT_EXPIRE_DAYS * 86400,
        path="/",
    )


async def upsert_user(db: AsyncSession, email: str, name: str | None,
                      avatar_url: str | None, provider: str, provider_id: str) -> User:
    result = await db.execute(
        select(User).where(User.provider == provider, User.provider_id == provider_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        # Try by email
        result2 = await db.execute(select(User).where(User.email == email))
        user = result2.scalar_one_or_none()

    if user:
        user.name = name or user.name
        user.avatar_url = avatar_url or user.avatar_url
        user.provider = provider
        user.provider_id = provider_id
    else:
        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            provider=provider,
            provider_id=provider_id,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)
    return user


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google")
async def google_redirect():
    cfg = _cfg()
    if not cfg.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
    params = {
        "client_id": cfg.google_client_id,
        "redirect_uri": f"{cfg.backend_url}/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    cfg = _cfg()
    async with httpx.AsyncClient() as client:
        token_res = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": cfg.google_client_id,
            "client_secret": cfg.google_client_secret,
            "redirect_uri": f"{cfg.backend_url}/auth/google/callback",
            "grant_type": "authorization_code",
        })
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(f"{cfg.frontend_url}/login?error=oauth_failed")

        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        info = user_res.json()

    user = await upsert_user(
        db,
        email=info["email"],
        name=info.get("name"),
        avatar_url=info.get("picture"),
        provider="google",
        provider_id=info["id"],
    )
    jwt_token = create_jwt(user)
    response = RedirectResponse(f"{cfg.frontend_url}/dashboard")
    set_auth_cookie(response, jwt_token)
    return response


# ── GitHub OAuth ──────────────────────────────────────────────────────────────

@router.get("/github")
async def github_redirect():
    cfg = _cfg()
    if not cfg.github_client_id:
        raise HTTPException(status_code=501, detail="GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.")
    params = {
        "client_id": cfg.github_client_id,
        "redirect_uri": f"{cfg.backend_url}/auth/github/callback",
        "scope": "read:user user:email",
    }
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{urlencode(params)}")


@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    cfg = _cfg()
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": cfg.github_client_id,
                "client_secret": cfg.github_client_secret,
                "code": code,
                "redirect_uri": f"{cfg.backend_url}/auth/github/callback",
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(f"{cfg.frontend_url}/login?error=oauth_failed")

        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        info = user_res.json()

        # GitHub may not expose email in /user — fetch from emails endpoint
        email = info.get("email")
        if not email:
            emails_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            )
            emails = emails_res.json()
            primary = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)
            email = primary or f"github_{info['id']}@users.noreply.github.com"

    user = await upsert_user(
        db,
        email=email,
        name=info.get("name") or info.get("login"),
        avatar_url=info.get("avatar_url"),
        provider="github",
        provider_id=str(info["id"]),
    )
    jwt_token = create_jwt(user)
    response = RedirectResponse(f"{cfg.frontend_url}/dashboard")
    set_auth_cookie(response, jwt_token)
    return response


# ── Session endpoints ─────────────────────────────────────────────────────────

@router.get("/me")
async def get_me(request: Request):
    token = request.cookies.get("archon_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, _cfg().jwt_secret, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid session")
    return {
        "token": token,
        "user": {
            "id": payload["sub"],
            "email": payload["email"],
            "name": payload["name"],
            "avatar_url": payload["avatar_url"],
            "provider": payload["provider"],
        },
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("archon_session", path="/")
    return {"ok": True}


# ── Dev login (local development only) ───────────────────────────────────────

@router.post("/dev")
async def dev_login(response: Response, db: AsyncSession = Depends(get_db)):
    """Create (or fetch) a dev user and issue a JWT cookie.

    This endpoint is intended for local development when real OAuth
    credentials are unavailable. It should NOT be exposed in production.
    """
    dev_email    = "developer@archon.ai"
    dev_name     = "Dev User"
    dev_provider = "dev"
    dev_pid      = "dev-user-001"

    result = await db.execute(
        select(User).where(User.provider == dev_provider, User.provider_id == dev_pid)
    )
    user = result.scalar_one_or_none()

    if not user:
        result2 = await db.execute(select(User).where(User.email == dev_email))
        user = result2.scalar_one_or_none()

    if user:
        user.name     = dev_name
        user.provider = dev_provider
        user.provider_id = dev_pid
    else:
        user = User(
            email=dev_email,
            name=dev_name,
            provider=dev_provider,
            provider_id=dev_pid,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    token = create_jwt(user)
    set_auth_cookie(response, token)
    return {
        "token": token,
        "user": {
            "id":         str(user.id),
            "email":      user.email,
            "name":       user.name,
            "avatar_url": user.avatar_url or "",
            "provider":   user.provider or "",
        },
    }
