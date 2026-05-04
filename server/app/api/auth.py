from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.models.user import User
from app.schemas.auth import RegisterSchema, LoginSchema
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])



@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}


@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }
    
@router.get('/me')
def user_profile(user:User= Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized User")
    
    return user