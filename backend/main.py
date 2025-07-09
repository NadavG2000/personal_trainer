from fastapi import FastAPI
from pydantic import BaseModel
from backend.orchestrator import create_custom_plan

app = FastAPI() 

class UserProfile(BaseModel):
    age: int
    weight_kg: float
    height_cm: float
    fitness_goal: str  # e.g., "gain muscle", "lose weight"
    dietary_preferences: list[str] = []

@app.post("/plan")
async def get_plan(profile: UserProfile):
    """
    Endpoint to generate a combined nutritional and workout plan.
    """
    plan = create_custom_plan(profile)
    return plan