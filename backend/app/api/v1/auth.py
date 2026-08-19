from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login_placeholder():
    return {"message": "Auth endpoint placeholder. Real auth to be implemented."}


@router.post("/signup")
def signup_placeholder():
    return {"message": "Signup endpoint placeholder. Real auth to be implemented."}
