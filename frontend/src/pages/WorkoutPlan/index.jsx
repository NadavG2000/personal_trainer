import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, RotateCcw, Trash2, Plus, Minus, Timer, Dumbbell } from "lucide-react";

export default function WorkoutPlanPage() {
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workoutLogs, setWorkoutLogs] = useState({});

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
        // Parse the workout plan structure
        const plan = data.workout?.plan_text || data.plan_text || "";
        console.log("Backend response:", data);
        console.log("Plan text:", plan);
        const parsedPlan = parseWorkoutPlan(plan);
        console.log("Parsed plan:", parsedPlan);
        setWorkoutPlan(parsedPlan);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  // Load workout logs from localStorage on component mount
  useEffect(() => {
    const savedLogs = localStorage.getItem("workoutLogs");
    if (savedLogs) {
      setWorkoutLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Save workout logs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("workoutLogs", JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  const parseWorkoutPlan = (planText) => {
    // If planText is empty or null, return null
    if (!planText || typeof planText !== 'string') {
      return null;
    }

    // Try to parse structured format first
    const days = planText.split(/(?=Day \d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
    
    if (days.length > 1) {
      return days.filter(day => day.trim()).map(day => {
        const lines = day.split('\n').filter(line => line.trim());
        const dayTitle = lines[0];
        const exercises = lines.slice(1).map(line => {
          // Try multiple regex patterns to match different formats
          const patterns = [
            /(.+?)\s*-\s*(\d+)\s*sets?\s*,\s*(\d+)\s*reps?/i,
            /(.+?)\s*:\s*(\d+)\s*x\s*(\d+)/i,
            /(.+?)\s*\((\d+)\s*sets?,\s*(\d+)\s*reps?\)/i,
            /(.+?)\s*(\d+)\s*sets?\s*(\d+)\s*reps?/i
          ];
          
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              return {
                name: match[1].trim(),
                sets: parseInt(match[2]),
                reps: parseInt(match[3]),
                rest: "60s"
              };
            }
          }
          
          // If no pattern matches, treat the line as an exercise with default values
          if (line.trim() && !line.includes('Day') && !line.includes('Rest')) {
            return {
              name: line.trim(),
              sets: 3,
              reps: 10,
              rest: "60s"
            };
          }
          
          return null;
        }).filter(exercise => exercise);
        
        return {
          day: dayTitle,
          exercises
        };
      });
    }

    // Fallback: treat the entire text as a single day
    const lines = planText.split('\n').filter(line => line.trim());
    const exercises = lines.map(line => {
      // Try to extract exercise information
      const patterns = [
        /(.+?)\s*-\s*(\d+)\s*sets?\s*,\s*(\d+)\s*reps?/i,
        /(.+?)\s*:\s*(\d+)\s*x\s*(\d+)/i,
        /(.+?)\s*\((\d+)\s*sets?,\s*(\d+)\s*reps?\)/i,
        /(.+?)\s*(\d+)\s*sets?\s*(\d+)\s*reps?/i
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          return {
            name: match[1].trim(),
            sets: parseInt(match[2]),
            reps: parseInt(match[3]),
            rest: "60s"
          };
        }
      }
      
      // If no pattern matches, treat as exercise with defaults
      if (line.trim() && line.length > 3) {
        return {
          name: line.trim(),
          sets: 3,
          reps: 10,
          rest: "60s"
        };
      }
      
      return null;
    }).filter(exercise => exercise);

    return [{
      day: "Workout Plan",
      exercises
    }];
  };

  const getExerciseKey = (dayIndex, exerciseIndex) => `${dayIndex}-${exerciseIndex}`;

  const logSet = (dayIndex, exerciseIndex, setIndex, reps, weight = "") => {
    const key = getExerciseKey(dayIndex, exerciseIndex);
    setWorkoutLogs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        sets: {
          ...prev[key]?.sets,
          [setIndex]: { reps, weight, completed: true, timestamp: Date.now() }
        }
      }
    }));
  };

  const undoSet = (dayIndex, exerciseIndex, setIndex) => {
    const key = getExerciseKey(dayIndex, exerciseIndex);
    setWorkoutLogs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        sets: {
          ...prev[key]?.sets,
          [setIndex]: { ...prev[key]?.sets[setIndex], completed: false }
        }
      }
    }));
  };

  const clearExerciseLog = (dayIndex, exerciseIndex) => {
    const key = getExerciseKey(dayIndex, exerciseIndex);
    setWorkoutLogs(prev => {
      const newLogs = { ...prev };
      delete newLogs[key];
      return newLogs;
    });
  };

  const getCompletedSets = (dayIndex, exerciseIndex) => {
    const key = getExerciseKey(dayIndex, exerciseIndex);
    const exerciseLog = workoutLogs[key];
    if (!exerciseLog?.sets) return 0;
    return Object.values(exerciseLog.sets).filter(set => set.completed).length;
  };

  const getTotalCompletedSets = () => {
    return Object.values(workoutLogs).reduce((total, exerciseLog) => {
      if (exerciseLog?.sets) {
        return total + Object.values(exerciseLog.sets).filter(set => set.completed).length;
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center text-green-600">Loading workout plan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-center">Your Workout Plan</h1>
        <div className="text-center text-gray-600 mb-4">
          Track your progress and log your sets in real-time
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-green-800 font-semibold">
            Total Sets Completed: {getTotalCompletedSets()}
          </div>
        </div>
      </div>

      {workoutPlan ? (
        <div className="space-y-8">
          {workoutPlan.map((day, dayIndex) => (
            <div key={dayIndex} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
                {day.day}
              </h2>
              <div className="grid gap-4">
                {day.exercises.map((exercise, exerciseIndex) => (
                  <ExerciseCard
                    key={exerciseIndex}
                    exercise={exercise}
                    dayIndex={dayIndex}
                    exerciseIndex={exerciseIndex}
                    completedSets={getCompletedSets(dayIndex, exerciseIndex)}
                    onLogSet={logSet}
                    onUndoSet={undoSet}
                    onClearLog={clearExerciseLog}
                    logs={workoutLogs[getExerciseKey(dayIndex, exerciseIndex)]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          No workout plan available. Please check back later.
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ exercise, dayIndex, exerciseIndex, completedSets, onLogSet, onUndoSet, onClearLog, logs }) {
  const [currentSet, setCurrentSet] = useState(1);
  const [currentReps, setCurrentReps] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");

  const handleLogSet = () => {
    if (currentReps && currentSet <= exercise.sets) {
      onLogSet(dayIndex, exerciseIndex, currentSet, currentReps, currentWeight);
      setCurrentReps("");
      setCurrentWeight("");
      if (currentSet < exercise.sets) {
        setCurrentSet(currentSet + 1);
      }
    }
  };

  const handleUndoLastSet = () => {
    if (currentSet > 1) {
      onUndoSet(dayIndex, exerciseIndex, currentSet - 1);
      setCurrentSet(currentSet - 1);
    }
  };

  const handleClearLog = () => {
    onClearLog(dayIndex, exerciseIndex);
    setCurrentSet(1);
    setCurrentReps("");
    setCurrentWeight("");
  };

  const isCompleted = completedSets === exercise.sets;

  return (
    <Card className={`transition-all duration-200 ${isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {exercise.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {completedSets}/{exercise.sets} sets
            </span>
            {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Dumbbell className="w-4 h-4" />
            {exercise.sets} sets × {exercise.reps} reps
          </div>
          <div className="flex items-center gap-1">
            <Timer className="w-4 h-4" />
            {exercise.rest} rest
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Set Logging Interface */}
        {currentSet <= exercise.sets && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="text-sm font-medium text-gray-700">
              Log Set {currentSet}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`reps-${dayIndex}-${exerciseIndex}`}>Reps</Label>
                <Input
                  id={`reps-${dayIndex}-${exerciseIndex}`}
                  type="number"
                  value={currentReps}
                  onChange={(e) => setCurrentReps(e.target.value)}
                  placeholder="e.g., 12"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`weight-${dayIndex}-${exerciseIndex}`}>Weight (kg)</Label>
                <Input
                  id={`weight-${dayIndex}-${exerciseIndex}`}
                  type="number"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="e.g., 20"
                  className="mt-1"
                />
              </div>
            </div>
            <Button 
              onClick={handleLogSet}
              disabled={!currentReps}
              className="w-full"
            >
              Log Set {currentSet}
            </Button>
          </div>
        )}

        {/* Completed Sets Display */}
        {logs?.sets && Object.keys(logs.sets).length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Completed Sets:</div>
            <div className="grid gap-2">
              {Object.entries(logs.sets)
                .filter(([_, set]) => set.completed)
                .map(([setIndex, set]) => (
                  <div key={setIndex} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">Set {setIndex}</span>
                      <span className="text-sm text-gray-800">{set.reps} reps</span>
                      {set.weight && (
                        <span className="text-sm text-gray-600">@ {set.weight}kg</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUndoSet(dayIndex, exerciseIndex, parseInt(setIndex))}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {currentSet > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndoLastSet}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Undo Last Set
            </Button>
          )}
          {Object.keys(logs?.sets || {}).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLog}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
