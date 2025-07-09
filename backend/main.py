from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from orchestrator import create_custom_plan
import logging

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

class UserProfile(BaseModel):
    age: int
    weight_kg: float
    height_cm: float
    fitness_goal: str  # e.g., "gain muscle", "lose weight"
    dietary_preferences: list[str] = []

@app.post("/plan")
async def get_plan(profile: UserProfile, request: Request):
    """
    Endpoint to generate a combined nutritional and workout plan.
    """
    logger.info(f"Received /plan request: {await request.body()}")
    try:
        plan = create_custom_plan(profile)
        logger.info(f"Generated plan: {plan}")
        return plan
    except Exception as e:
        logger.error(f"Error generating plan: {e}")
        return {"error": str(e)}