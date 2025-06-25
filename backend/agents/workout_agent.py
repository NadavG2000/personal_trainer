import os
import openai
from dotenv import load_dotenv

load_dotenv()   # reads .env into os.environ

openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_workout_plan(profile):
    prompt = (
        f"You are a certified personal trainer. Create a 7-day workout routine for a user with the following profile:\n"
        f"- Age: {profile.age} years\n"
        f"- Weight: {profile.weight_kg} kg\n"
        f"- Height: {profile.height_cm} cm\n"
        f"- Fitness Goal: {profile.fitness_goal}\n\n"
        "Please output a structured routine, day by day."
    )

    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role":"system","content":"You are a workout expert."},
                  {"role":"user","content":prompt}],
        max_tokens=400,
        temperature=0.2
    )
    text = resp.choices[0].message.content
    return {"plan_text": text.strip()}
