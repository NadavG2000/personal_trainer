import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserProfile } from "@/entities/all";
import { createPageUrl } from "@/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const steps = [
  { id: 1, title: "Basic Info", fields: ["age", "gender", "weight", "height"] },
  { id: 2, title: "Fitness Goals", fields: ["goal", "experience_level", "workout_days_per_week"] },
  { id: 3, title: "Preferences", fields: ["dietary_preferences"] },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "",
    goal: "",
    experience_level: "",
    workout_days_per_week: "",
    dietary_preferences: "",
  });
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        const profiles = await UserProfile.filter({ created_by: user.email });
        if (profiles.length > 0) {
          setUserProfile(profiles[0]);
          setFormData(profiles[0]);
        }
      } catch (e) {
        navigate(createPageUrl("Login"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (userProfile) {
        await UserProfile.update(userProfile.id, formData);
      } else {
        await UserProfile.create(formData);
      }
      // Save to localStorage for profile page
      localStorage.setItem("userProfileData", JSON.stringify(formData));
      navigate(createPageUrl("Menu"));
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  if (isLoading && !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {userProfile ? "Edit Your Profile" : "Welcome to FitGenius"}
          </CardTitle>
          <CardDescription>
            {userProfile
              ? "Update your details below."
              : "Let's get some information to personalize your fitness plan."}
          </CardDescription>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(v) => handleInputChange("gender", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Fitness Goal</Label>
                    <Select
                      value={formData.goal}
                      onValueChange={(v) => handleInputChange("goal", v)}
                    >
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
                  </div>
                  <div>
                    <Label>Experience Level</Label>
                    <Select
                      value={formData.experience_level}
                      onValueChange={(v) => handleInputChange("experience_level", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Workout Days / Week</Label>
                    <Select
                      value={formData.workout_days_per_week}
                      onValueChange={(v) =>
                        handleInputChange("workout_days_per_week", v)
                      }
                    >
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
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <Label>Dietary Preferences</Label>
                  <Textarea
                    placeholder="e.g. vegetarian, no shellfish, allergic to peanuts"
                    value={formData.dietary_preferences}
                    onChange={(e) =>
                      handleInputChange("dietary_preferences", e.target.value)
                    }
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              Back
            </Button>
            {currentStep < steps.length ? (
              <Button onClick={nextStep}>Next</Button>
            ) : (
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                Save Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
