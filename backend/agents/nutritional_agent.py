import os
import openai
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()   # reads .env into os.environ

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_nutritional_plan(profile):
    prompt = (
        f"You are a professional fitness assistant. Create a 7-day nutritional plan for a user with the following profile:\n"
        f"- Age: {profile.age} years\n"
        f"- Weight: {profile.weight_kg} kg\n"
        f"- Height: {profile.height_cm} cm\n"
        f"- Fitness Goal: {profile.fitness_goal}\n"
        f"- Dietary Preferences: {', '.join(profile.dietary_preferences) or 'none'}\n\n"
        "Please output a structured meal plan, day by day."
    )

    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role":"system","content":"You are a nutrition expert."},
                  {"role":"user","content":prompt}],
        max_tokens=400,
        temperature=0.2
    )
    text = resp.choices[0].message.content
    return {"plan_text": text.strip()}
