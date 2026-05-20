"""User profile endpoints — read + update the signed-in user's own record.

OAuth-sourced fields (email, name, avatar_url, provider) are read-only here —
they come from the identity provider. Only ``bio`` and ``timezone`` are user-
editable preferences.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.session import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/user", tags=["User"])


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    avatar_url: str | None
    provider: str | None
    tier: str
    bio: str | None
    timezone: str | None

    @classmethod
    def from_orm_user(cls, user: User) -> "UserResponse":
        return cls(
            id=str(user.id),
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            provider=user.provider,
            tier=user.tier,
            bio=user.bio,
            timezone=user.timezone,
        )


class UserPatchBody(BaseModel):
    bio: str | None = Field(default=None, max_length=500)
    timezone: str | None = Field(default=None, max_length=64)


@router.get("/me", response_model=UserResponse, summary="Get the signed-in user")
async def get_me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.from_orm_user(user)


@router.patch("/me", response_model=UserResponse, summary="Update profile preferences")
async def patch_me(
    body: UserPatchBody,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update the signed-in user's bio and/or timezone.

    Email, name, avatar and provider are OAuth-sourced and cannot be changed
    through this endpoint — request them by re-authenticating.
    """
    # Only update fields that the client explicitly sent (PATCH semantics)
    fields = body.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No editable fields provided.",
        )

    for key, value in fields.items():
        setattr(user, key, value)

    db.add(user)
    await db.flush()
    await db.refresh(user)
    return UserResponse.from_orm_user(user)
