import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Plus, TrendingUp, Calendar, Dumbbell, Target } from "lucide-react";

export default function ProgressPage() {
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [exerciseList, setExerciseList] = useState([]);
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    sets: [{ reps: "", weight: "" }]
  });

  // Load workout logs from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem("workoutLogs");
    if (savedLogs) {
      const logs = JSON.parse(savedLogs);
      setWorkoutLogs(logs);
      
      // Extract unique exercise names
      const exercises = new Set();
      Object.values(logs).forEach(exerciseLog => {
        if (exerciseLog.exerciseName) {
          exercises.add(exerciseLog.exerciseName);
        }
      });
      setExerciseList(Array.from(exercises));
    }
  }, []);

  // Save workout logs to localStorage
  useEffect(() => {
    localStorage.setItem("workoutLogs", JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  const addSet = () => {
    setNewLog(prev => ({
      ...prev,
      sets: [...prev.sets, { reps: "", weight: "" }]
    }));
  };

  const removeSet = (index) => {
    setNewLog(prev => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index)
    }));
  };

  const updateSet = (index, field, value) => {
    setNewLog(prev => ({
      ...prev,
      sets: prev.sets.map((set, i) => 
        i === index ? { ...set, [field]: value } : set
      )
    }));
  };

  const logWorkout = () => {
    if (!selectedExercise || newLog.sets.some(set => !set.reps)) {
      return;
    }

    const exerciseKey = `${selectedExercise}-${newLog.date}`;
    const totalVolume = newLog.sets.reduce((sum, set) => {
      const reps = parseInt(set.reps) || 0;
      const weight = parseFloat(set.weight) || 0;
      return sum + (reps * weight);
    }, 0);

    setWorkoutLogs(prev => ({
      ...prev,
      [exerciseKey]: {
        exerciseName: selectedExercise,
        date: newLog.date,
        sets: newLog.sets.map((set, index) => ({
          setNumber: index + 1,
          reps: parseInt(set.reps) || 0,
          weight: parseFloat(set.weight) || 0
        })),
        totalVolume,
        timestamp: Date.now()
      }
    }));

    // Reset form
    setNewLog({
      date: new Date().toISOString().split('T')[0],
      sets: [{ reps: "", weight: "" }]
    });
    setShowLogDialog(false);
    setSelectedExercise("");

    // Update exercise list
    if (!exerciseList.includes(selectedExercise)) {
      setExerciseList(prev => [...prev, selectedExercise]);
    }
  };

  const getExerciseData = (exerciseName) => {
    const data = [];
    Object.values(workoutLogs).forEach(log => {
      if (log.exerciseName === exerciseName) {
        data.push({
          date: log.date,
          volume: log.totalVolume,
          sets: log.sets.length,
          avgWeight: log.sets.reduce((sum, set) => sum + set.weight, 0) / log.sets.length,
          avgReps: log.sets.reduce((sum, set) => sum + set.reps, 0) / log.sets.length
        });
      }
    });
    return data.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getOverallStats = () => {
    const stats = {
      totalWorkouts: Object.keys(workoutLogs).length,
      totalVolume: 0,
      exercises: exerciseList.length,
      lastWorkout: null
    };

    Object.values(workoutLogs).forEach(log => {
      stats.totalVolume += log.totalVolume;
      if (!stats.lastWorkout || new Date(log.date) > new Date(stats.lastWorkout)) {
        stats.lastWorkout = log.date;
      }
    });

    return stats;
  };

  const overallStats = getOverallStats();

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-center">Progress Tracker</h1>
        <div className="text-center text-gray-600 mb-6">
          Track your workout performance and visualize your progress
        </div>
        
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{overallStats.totalWorkouts}</div>
                  <div className="text-sm text-gray-600">Total Workouts</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{overallStats.totalVolume.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Volume</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{overallStats.exercises}</div>
                  <div className="text-sm text-gray-600">Exercises</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {overallStats.lastWorkout ? new Date(overallStats.lastWorkout).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Last Workout</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Log Workout Button */}
        <div className="text-center mb-8">
          <Button onClick={() => setShowLogDialog(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Log Workout
          </Button>
        </div>
      </div>

      {/* Exercise Progress Charts */}
      {exerciseList.length > 0 ? (
        <div className="space-y-8">
          {exerciseList.map(exercise => {
            const data = getExerciseData(exercise);
            if (data.length === 0) return null;

            return (
              <Card key={exercise}>
                <CardHeader>
                  <CardTitle className="text-xl">{exercise}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                          formatter={(value, name) => [
                            name === 'volume' ? `${value} kg` : value,
                            name === 'volume' ? 'Total Volume' : name === 'sets' ? 'Sets' : 'Avg Weight'
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Exercise Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.max(...data.map(d => d.volume)).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Best Volume</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {data.length}
                      </div>
                      <div className="text-sm text-gray-600">Workouts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {data.length > 1 ? 
                          ((data[data.length - 1].volume - data[0].volume) / data[0].volume * 100).toFixed(1) + '%' 
                          : 'N/A'
                        }
                      </div>
                      <div className="text-sm text-gray-600">Progress</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <div className="text-xl font-semibold mb-2">No workout data yet</div>
          <div className="text-gray-600">Log your first workout to start tracking your progress!</div>
        </div>
      )}

      {/* Log Workout Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Workout</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Exercise Name</Label>
              <Input
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                placeholder="e.g., Bench Press"
              />
            </div>
            
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newLog.date}
                onChange={(e) => setNewLog(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Sets</Label>
              <div className="space-y-2">
                {newLog.sets.map((set, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={set.reps}
                      onChange={(e) => updateSet(index, 'reps', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Weight (kg)"
                      value={set.weight}
                      onChange={(e) => updateSet(index, 'weight', e.target.value)}
                      className="flex-1"
                    />
                    {newLog.sets.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSet(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addSet}>
                  Add Set
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>
              Cancel
            </Button>
            <Button onClick={logWorkout} disabled={!selectedExercise || newLog.sets.some(set => !set.reps)}>
              Log Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 