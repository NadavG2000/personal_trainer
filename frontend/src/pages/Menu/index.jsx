import React, { useEffect, useState } from "react";

export default function MenuPage() {
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
        const user = JSON.parse(localStorage.getItem("user") || "{}" );
        // Prepare payload for backend
        const payload = {
          email: user.email,
          age: Number(profile.age),
          weight_kg: Number(profile.weight),
          height_cm: Number(profile.height),
          fitness_goal: profile.goal,
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
        // The backend returns {workout: {...}, nutrition: {...}} or just the plan object
        setPlan(data.nutrition?.plan_text || data.plan_text || "");
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
      <h1 className="text-3xl font-bold mb-6 text-center">Your Menu</h1>
      {loading && <div className="text-center text-green-600">Loading menu...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      {!loading && !error && plan && (
        <div className="bg-white rounded-xl shadow p-6 whitespace-pre-line">{plan}</div>
      )}
    </div>
  );
} 