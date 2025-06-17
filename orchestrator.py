from agents.nutritional_agent import generate_nutritional_plan
from agents.workout_agent import generate_workout_plan

def create_custom_plan(profile):
    """
    Calls both nutritional and workout agents to compose a full plan.
    """
    nutrition = generate_nutritional_plan(profile)
    workout = generate_workout_plan(profile)
    return {
        "nutrition": nutrition,
        "workout": workout
    }