import React, { useEffect, useState } from "react";

export default function WorkoutPlanPage() {
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      setError("");
      try {
        // Get user profile data from localStorage
        const profile = JSON.parse(localStorage.getItem("userProfileData") || "{}" );
        // Fallbacks for required fields
        const payload = {
          age: Number(profile.age) || 25,
          weight_kg: Number(profile.weight) || 70,
          height_cm: Number(profile.height) || 170,
          fitness_goal: profile.goal || "maintain_weight",
          dietary_preferences: profile.dietary_preferences
            ? profile.dietary_preferences.split(",").map(s => s.trim()).filter(Boolean)
            : [],
        };
        const res = await fetch("http://localhost:8000/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to fetch plan");
        const data = await res.json();
        setPlan(data.workout.plan_text);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Workout Plan</h1>
      {loading && <div className="text-center text-green-600">Loading workout plan...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      {!loading && !error && plan && (
        <div className="bg-white rounded-xl shadow p-6 whitespace-pre-line">{plan}</div>
      )}
    </div>
  );
}
