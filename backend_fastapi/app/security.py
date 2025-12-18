import os
import time
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Password hashing context: prefer pbkdf2_sha256 but accept bcrypt for legacy hashes
# Note: bcrypt may require the 'bcrypt' wheel installed. If unavailable, legacy bcrypt
# verification will fail and those users won't be able to login until rehashed.
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"],
    deprecated="auto",
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)

def needs_rehash(hashed_password: str) -> bool:
    """Return True if given hash should be updated to the preferred scheme."""
    try:
        return pwd_context.needs_update(hashed_password)
    except Exception:
        return False

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRES_SECONDS = int(os.getenv("ACCESS_TOKEN_EXPIRES_SECONDS", "3600"))
REFRESH_TOKEN_EXPIRES_SECONDS = int(os.getenv("REFRESH_TOKEN_EXPIRES_SECONDS", "604800"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def create_access_token(data: Dict[str, Any], expires_in: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = int(time.time()) + (expires_in or ACCESS_TOKEN_EXPIRES_SECONDS)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: Dict[str, Any], expires_in: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = int(time.time()) + (expires_in or REFRESH_TOKEN_EXPIRES_SECONDS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


async def get_current_user_claims(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid access token")
    return payload
