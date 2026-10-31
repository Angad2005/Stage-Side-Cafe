import hmac
import json
import logging
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Cookie, Depends, Query, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db, TwitchAccount, User
from app.twitch.service import twitch_service
from .dependencies import get_current_user
from .jwt import create_access_token

logger = logging.getLogger("stageside.auth")

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/twitch/login")
async def twitch_login(response: Response):
    """Create a one-use OAuth state and return Twitch's authorization URL."""
    state = secrets.token_urlsafe(32)
    response.set_cookie(
        "stageside_twitch_state",
        state,
        max_age=600,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
        path="/",
    )
    return {
        "login_url": twitch_service.authorization_url(state),
        "configured": twitch_service.configured,
    }


@router.get("/twitch/callback")
async def twitch_callback(
    code: str | None = Query(None),
    state: str | None = Query(None),
    oauth_error: str | None = Query(None, alias="error"),
    error_description: str | None = Query(None),
    saved_state: str | None = Cookie(None, alias="stageside_twitch_state"),
    db: AsyncSession = Depends(get_db),
):
    """Exchange Twitch's one-use code and return the app session to the web client."""
    if oauth_error:
        return _callback_error(error_description or "Twitch authorization was cancelled")
    if not code or not state or not saved_state or not hmac.compare_digest(state, saved_state):
        return _callback_error("Twitch sign-in expired. Please try again.")
    if not twitch_service.configured:
        return _callback_error("Add your Twitch client ID and secret to .env, then restart the API.")

    try:
        token_data = await twitch_service.exchange_code(code)
        access_token = token_data["access_token"]
        validation = await twitch_service.validate_access_token(access_token)
        if validation.get("client_id") != settings.TWITCH_CLIENT_ID:
            return _callback_error("Twitch returned a token for a different application.")
        twitch_user = await twitch_service.get_authorized_user(access_token)
        if str(validation.get("user_id")) != str(twitch_user.get("id")):
            return _callback_error("Twitch account validation did not match the returned profile.")
    except (httpx.HTTPError, KeyError, RuntimeError) as error:
        logger.warning("Twitch OAuth exchange failed: %s", error)
        return _callback_error("Twitch could not complete sign-in. Check your app settings and try again.")

    try:
        twitch_user_id = str(twitch_user["id"])
        login = str(twitch_user["login"]).lower()
        account = await db.scalar(
            select(TwitchAccount).where(TwitchAccount.twitch_user_id == twitch_user_id)
        )

        if account:
            user = await db.get(User, account.user_id)
        else:
            username = login[:100]
            collision = await db.scalar(select(User).where(User.username == username))
            if collision:
                username = f"{login[:88]}_{twitch_user_id[-10:]}"
            user = User(
                username=username,
                display_name=twitch_user.get("display_name", login),
                role="streamer",
            )
            db.add(user)
            await db.flush()
            account = TwitchAccount(user_id=user.id, twitch_user_id=twitch_user_id)
            db.add(account)

        user.username = user.username or login
        user.display_name = twitch_user.get("display_name", login)
        user.avatar_url = twitch_user.get("profile_image_url")
        user.role = "streamer"
        account.twitch_username = login
        account.encrypted_access_token = twitch_service.encrypt_token(access_token)
        account.encrypted_refresh_token = twitch_service.encrypt_token(token_data["refresh_token"])
        account.token_expires_at = datetime.utcnow() + timedelta(
            seconds=token_data.get("expires_in", 0)
        )
        scopes = token_data.get("scope") or validation.get("scopes") or []
        if isinstance(scopes, str):
            account.scopes = ",".join(scopes.split())
        else:
            account.scopes = ",".join(str(scope) for scope in scopes)

        await db.commit()
        await db.refresh(user)
    except SQLAlchemyError:
        await db.rollback()
        logger.exception("Could not persist the Twitch account after OAuth")
        return _callback_error(
            "StageSide could not save your Twitch connection. Check that the database is running and try again."
        )
    app_token = create_access_token(
        {"sub": user.id, "username": user.username, "role": user.role}
    )
    user_payload = {
        "id": user.id,
        "username": user.username,
        "displayName": user.display_name,
        "role": user.role,
        "avatarUrl": user.avatar_url,
    }
    fragment = urlencode({
        "access_token": app_token,
        "user": json.dumps(user_payload),
    })
    redirect = RedirectResponse(
        f"{settings.WEB_APP_URL.rstrip('/')}/auth/callback#{fragment}",
        status_code=303,
    )
    redirect.delete_cookie("stageside_twitch_state", path="/")
    return redirect


def _callback_error(message: str) -> RedirectResponse:
    fragment = urlencode({"error": message})
    redirect = RedirectResponse(
        f"{settings.WEB_APP_URL.rstrip('/')}/auth/callback#{fragment}",
        status_code=303,
    )
    redirect.delete_cookie("stageside_twitch_state", path="/")
    return redirect


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "displayName": user.display_name,
        "role": user.role,
        "avatarUrl": user.avatar_url,
        "createdAt": user.created_at.isoformat(),
    }


@router.post("/logout")
async def logout():
    return {"status": "success", "message": "Logged out successfully"}
