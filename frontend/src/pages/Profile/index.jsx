import React, { useState, useEffect } from "react";
import { useAuth } from "@/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const defaultProfile = {
  name: "",
  email: "",
  age: "",
  weight: "",
  height: "",
  gender: "",
  goal: "",
  experience_level: "",
  workout_days_per_week: "",
  dietary_preferences: "",
};

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [form, setForm] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // Load profile data from localStorage
    const stored = localStorage.getItem("userProfileData");
    let profileData = stored ? JSON.parse(stored) : {};
    if (user) {
      profileData = { ...defaultProfile, ...profileData, name: user.name || "", email: user.email || "" };
    } else {
      profileData = { ...defaultProfile, ...profileData };
    }
    setForm(profileData);
  }, [user]);

  const handleInput = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelect = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("userProfileData", JSON.stringify(form));
    if (user) login({ ...user, name: form.name, email: form.email });
    setEditing(false);
  };

  if (!user) return null;

  return (
    <div className="p-8 flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form className="space-y-4" onSubmit={handleSave}>
              <Input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleInput}
              />
              <Input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleInput}
              />
              <Input
                name="age"
                type="number"
                placeholder="Age"
                value={form.age}
                onChange={handleInput}
              />
              <Select value={form.gender} onValueChange={(v) => handleSelect("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                name="weight"
                type="number"
                placeholder="Weight (kg)"
                value={form.weight}
                onChange={handleInput}
              />
              <Input
                name="height"
                type="number"
                placeholder="Height (cm)"
                value={form.height}
                onChange={handleInput}
              />
              <Select value={form.goal} onValueChange={(v) => handleSelect("goal", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_weight">Lose Weight</SelectItem>
                  <SelectItem value="build_muscle">Build Muscle</SelectItem>
                  <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                  <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.experience_level} onValueChange={(v) => handleSelect("experience_level", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.workout_days_per_week} onValueChange={(v) => handleSelect("workout_days_per_week", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select number of days" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(7)].map((_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1} day{i > 0 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                name="dietary_preferences"
                placeholder="e.g. vegetarian, no shellfish, allergic to peanuts"
                value={form.dietary_preferences}
                onChange={handleInput}
              />
              <Button type="submit" className="w-full">Save</Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div><span className="font-semibold">Name:</span> {form.name}</div>
              <div><span className="font-semibold">Email:</span> {form.email}</div>
              <div><span className="font-semibold">Age:</span> {form.age}</div>
              <div><span className="font-semibold">Gender:</span> {form.gender}</div>
              <div><span className="font-semibold">Weight:</span> {form.weight} kg</div>
              <div><span className="font-semibold">Height:</span> {form.height} cm</div>
              <div><span className="font-semibold">Goal:</span> {form.goal}</div>
              <div><span className="font-semibold">Experience Level:</span> {form.experience_level}</div>
              <div><span className="font-semibold">Workout Days/Week:</span> {form.workout_days_per_week}</div>
              <div><span className="font-semibold">Dietary Preferences:</span> {form.dietary_preferences}</div>
              <Button className="w-full" onClick={() => setEditing(true)}>
                Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 