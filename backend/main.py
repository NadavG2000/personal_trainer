from fastapi import FastAPI, Request, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator
from orchestrator import create_custom_plan
from db import save_user, get_user
import logging
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from decimal import Decimal
import os
from dotenv import load_dotenv
import re

load_dotenv()

app = FastAPI() 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or "*" to allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "users-data")
AUTH_TABLE_NAME = os.getenv("DYNAMODB_AUTH_TABLE_NAME", "users-auth")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

security = HTTPBearer()

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    return True, ""

class UserRegistration(BaseModel):
    email: str
    password: str
    name: str

    @validator('email')
    def validate_email(cls, v):
        if not validate_email(v):
            raise ValueError('Invalid email format')
        return v.lower().strip()

    @validator('password')
    def validate_password(cls, v):
        is_valid, error_msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v

    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name is required')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        if len(v.strip()) > 100:
            raise ValueError('Name must be less than 100 characters')
        return v.strip()

class UserLogin(BaseModel):
    email: str
    password: str

    @validator('email')
    def validate_email(cls, v):
        if not validate_email(v):
            raise ValueError('Invalid email format')
        return v.lower().strip()

class UserProfile(BaseModel):
    email: str
    age: int
    weight_kg: float
    height_cm: float
    fitness_goal: str  # e.g., "gain muscle", "lose weight"
    dietary_preferences: list[str] = []
    feedback: Optional[dict] = None  # For weekly update (optional)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

@app.post("/register")
async def register_user(user_data: UserRegistration):
    """
    Register a new user with email and password.
    """
    try:
        # Check if user already exists
        existing_user = get_user(AUTH_TABLE_NAME, user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Hash password and create user
        hashed_password = hash_password(user_data.password)
        user_record = {
            "email": user_data.email,
            "name": user_data.name,
            "password_hash": hashed_password,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        
        # Save to DynamoDB auth table
        save_user(AUTH_TABLE_NAME, user_record)
        
        # Create access token
        access_token = create_access_token(data={"sub": user_data.email})
        
        logger.info(f"User registered successfully: {user_data.email}")
        return {
            "message": "User registered successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user_data.email,
                "name": user_data.name
            }
        }
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error during registration: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")

@app.post("/login")
async def login_user(user_credentials: UserLogin):
    """
    Authenticate user and return access token.
    """
    try:
        # Get user from auth database
        user_record = get_user(AUTH_TABLE_NAME, user_credentials.email)
        if not user_record:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(user_credentials.password, user_record["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token = create_access_token(data={"sub": user_credentials.email})
        
        logger.info(f"User logged in successfully: {user_credentials.email}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user_record["email"],
                "name": user_record["name"]
            }
        }
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error during login: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")

@app.post("/plan")
async def get_or_create_plan(profile: UserProfile, request: Request, force_new: bool = Query(False)):
    """
    Get plan from DB if exists, else generate and save.
    If force_new is True, always generate a new plan (for weekly update).
    """
    logger.info(f"Received /plan request: {await request.body()}")
    # Try to get existing plan
    if not force_new:
        user_data = get_user(TABLE_NAME, profile.email)
        if user_data and "plan" in user_data:
            logger.info(f"Serving plan from DB for {profile.email}")
            return user_data["plan"]

    # Generate new plan
    plan = create_custom_plan(profile)
    # Convert float values to Decimal for DynamoDB
    profile_dict = profile.dict()
    profile_dict["weight_kg"] = Decimal(str(profile_dict["weight_kg"]))
    profile_dict["height_cm"] = Decimal(str(profile_dict["height_cm"]))
    # Save plan to DB
    save_user(TABLE_NAME, {**profile_dict, "plan": plan})
    logger.info(f"Generated and saved new plan for {profile.email}")
    return plan

# --- TEST ENDPOINT ---
from fastapi.responses import JSONResponse

@app.post("/test_flow")
async def test_flow():
    """
    Test the full flow: create, retrieve, update plan.
    """
    test_email = "testuser@example.com"
    test_profile = UserProfile(
        email=test_email,
        age=30,
        weight_kg=70,
        height_cm=175,
        fitness_goal="build_muscle",
        dietary_preferences=["vegetarian"],
        feedback=None
    )
    # 1. Generate and save plan
    plan1 = create_custom_plan(test_profile)
    save_user(TABLE_NAME, {**test_profile.dict(), "plan": plan1})
    # 2. Retrieve plan
    user_data = get_user(TABLE_NAME, test_email)
    plan_from_db = user_data["plan"] if user_data else None
    # 3. Update plan with feedback
    test_profile.feedback = {"difficulty": "too_hard", "enjoyment": 2}
    plan2 = create_custom_plan(test_profile)
    save_user(TABLE_NAME, {**test_profile.dict(), "plan": plan2})
    # 4. Retrieve updated plan
    user_data2 = get_user(TABLE_NAME, test_email)
    plan_from_db2 = user_data2["plan"] if user_data2 else None
    return JSONResponse({
        "initial_plan": plan1,
        "plan_from_db": plan_from_db,
        "updated_plan": plan2,
        "plan_from_db_after_update": plan_from_db2
    })