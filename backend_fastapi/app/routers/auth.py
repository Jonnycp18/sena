from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from psycopg.rows import dict_row
from ..db import get_conn
from ..security import (
    create_access_token,
    create_refresh_token,
    get_current_user_claims,
    needs_rehash,
    hash_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest):
    # Busca usuario y valida password_hash con bcrypt
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT id, email, nombre, apellido, rol, activo, password_hash FROM users WHERE email = %s",
            [payload.email],
        )
        user = cur.fetchone()

    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    from ..security import verify_password  # local import to avoid circular
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    if not user.get("activo"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")

    # Auto-upgrade legacy hashes to preferred scheme after successful login
    try:
        if needs_rehash(user["password_hash"]):
            new_hash = hash_password(payload.password)
            with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    "UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s",
                    [new_hash, user["id"]],
                )
                conn.commit()
    except Exception:
        # Non-fatal: continue issuing tokens even if rehash fails
        pass

    claims = {
        "sub": str(user["id"]),
        "email": user["email"],
        "rol": (user.get("rol") or "docente").lower(),
    }
    return TokenPair(
        access_token=create_access_token(claims),
        refresh_token=create_refresh_token({"sub": claims["sub"]}),
    )


@router.get("/me")
def me(claims: dict = Depends(get_current_user_claims)):
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT id, email, nombre, apellido, rol, activo, avatar_url, telefono FROM users WHERE id = %s",
            [int(claims["sub"])],
        )
        user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest):
    from ..security import decode_token

    data = decode_token(payload.refresh_token)
    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    new_access = create_access_token({"sub": data["sub"]})
    new_refresh = create_refresh_token({"sub": data["sub"]})
    return TokenPair(access_token=new_access, refresh_token=new_refresh)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, claims: dict = Depends(get_current_user_claims)):
    user_id = int(claims["sub"])
    from ..security import verify_password, hash_password
    with get_conn() as conn, conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT id, password_hash FROM users WHERE id = %s", [user_id])
        row = cur.fetchone()
        if not row or not row.get("password_hash"):
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if not verify_password(payload.old_password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Password actual incorrecto")
        new_hash = hash_password(payload.new_password)
        cur.execute("UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s", [new_hash, user_id])
        conn.commit()
    return {"ok": True, "message": "Password actualizado"}


@router.post("/logout")
def logout(_: dict = Depends(get_current_user_claims)):
    # Sin estado; en producción podrías usar blacklist o revocación/rotación
    return {"ok": True}
