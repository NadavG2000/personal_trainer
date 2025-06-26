
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserProfile } from '@/entities/all';
import { InvokeLLM } from '@/integrations/Core';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bot, PartyPopper, CheckCircle, Leaf, Dumbbell, Flame } from 'lucide-react';

const planJsonSchema = {
    type: "object",
    properties: {
        workout_plan: {
            type: "object",
            description: "A 7-day workout plan.",
            additionalProperties: {
                type: "object",
                properties: {
                    day_of_week: { type: "string" },
                    focus: { type: "string" },
                    exercises: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                sets: { type: "string" },
                                reps: { type: "string" },
                                rest: { type: "string" }
                            },
                            required: ["name", "sets", "reps"]
                        }
                    }
                },
            },
        },
        nutrition_plan: {
            type: "object",
            description: "A 7-day nutrition plan.",
            additionalProperties: {
                type: "object",
                properties: {
                    day_of_week: { type: "string" },
                    daily_calories: { type: "number" },
                    meals: {
                        type: "object",
                        properties: {
                            breakfast: { type: "string" },
                            lunch: { type: "string" },
                            dinner: { type: "string" },
                            snacks: { type: "string" }
                        }
                    }
                }
            }
        }
    },
    required: ["workout_plan", "nutrition_plan"]
};


export default function Dashboard() {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedback, setFeedback] = useState({
        workout_difficulty: 'just_right',
        enjoyment_rating: 3,
        progress_notes: '',
        current_weight: ''
    });

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            const profiles = await UserProfile.filter({ created_by: user.email });
            if (profiles.length === 0) {
                navigate(createPageUrl('Onboarding'));
            } else {
                setUserProfile(profiles[0]);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            navigate(createPageUrl('Onboarding'));
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const generatePlan = async (feedbackData = null) => {
        if (!userProfile) return;
        setIsGenerating(true);

        const prompt = `
            You are an expert fitness and nutrition coach named FitGenius.
            A user has provided their profile information and feedback on their previous week.
            Your task is to generate a new, personalized, one-week (7-day, starting from today's day of the week) workout and nutrition plan.
            
            **User Profile:**
            - Age: ${userProfile.age}
            - Gender: ${userProfile.gender}
            - Weight: ${userProfile.weight} kg
            - Height: ${userProfile.height} cm
            - Goal: ${userProfile.goal.replace('_', ' ')}
            - Experience Level: ${userProfile.experience_level}
            - Workout Days Per Week: ${userProfile.workout_days_per_week}
            - Dietary Preferences: ${userProfile.dietary_preferences || 'None'}

            ${feedbackData ? `
            **Previous Week's Feedback:**
            - Workout Difficulty: ${feedbackData.workout_difficulty.replace('_', ' ')}
            - Enjoyment Rating: ${feedbackData.enjoyment_rating}/5
            - Current Weight: ${feedbackData.current_weight || userProfile.weight} kg
            - Notes: ${feedbackData.progress_notes || 'None'}
            ` : `
            This is the user's first plan. Make it welcoming and appropriate for their experience level.
            `}

            **Instructions:**
            1.  **Analyze:** Based on all the data, create a balanced and effective plan. If feedback is provided, adjust the plan accordingly. For example, if the workout was 'too_hard', reduce intensity. If enjoyment was low, vary the exercises.
            2.  **Workout Plan:** Generate a plan for ${userProfile.workout_days_per_week} days, with active recovery or rest days in between.
            3.  **Nutrition Plan:** The meal plan should align with the user's fitness goal and dietary preferences. Provide an estimated daily calorie count.
            4.  **Format:** Return the response in the required JSON format. Ensure all 7 days of the week are present in both workout and nutrition plans.
        `;
        
        try {
            const result = await InvokeLLM({
                prompt: prompt,
                response_json_schema: planJsonSchema
            });
            if (result) {
                await UserProfile.update(userProfile.id, {
                    current_workout_plan: result.workout_plan,
                    current_nutrition_plan: result.nutrition_plan,
                    weight: feedbackData?.current_weight || userProfile.weight
                });
                if(feedbackData){
                    await WeeklyFeedback.create({
                        ...feedbackData,
                        user_profile_id: userProfile.id,
                        week_ending_date: new Date().toISOString().split('T')[0]
                    });
                }
                await loadProfile();
            }
        } catch (error) {
            console.error("Failed to generate plan:", error);
        } finally {
            setIsGenerating(false);
            setShowFeedbackModal(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>;
    }

    if (!userProfile) {
        return null;
    }

    const { current_workout_plan, current_nutrition_plan } = userProfile;
    const workoutDays = current_workout_plan ? Object.values(current_workout_plan) : [];
    const nutritionDays = current_nutrition_plan ? Object.values(current_nutrition_plan) : [];


    return (
        <div className="p-4 md:p-8 space-y-8 mb-16 md:mb-0">
            <header>
                <h1 className="text-3xl font-bold">Your Dashboard</h1>
                <p className="text-gray-500">Here's your personalized plan for the week. Stay consistent!</p>
            </header>

            {!current_workout_plan && !isGenerating && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <PartyPopper className="h-5 w-5 text-green-600" />
                    <AlertTitle className="font-bold">Welcome to FitGenius!</AlertTitle>
                    <AlertDescription>
                        Your profile is set up. Ready to generate your first personalized fitness plan?
                        <Button className="mt-4" onClick={() => generatePlan()}>
                            <Bot className="mr-2 h-4 w-4" /> Generate My First Plan
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {isGenerating && (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-4" />
                    <CardTitle>Your AI coach is thinking...</CardTitle>
                    <p className="text-gray-600 mt-2">Crafting the perfect plan based on your latest data. This might take a moment.</p>
                </Card>
            )}

            {!isGenerating && current_workout_plan && (
                <>
                <Button onClick={() => setShowFeedbackModal(true)} size="lg" className="w-full">
                    <CheckCircle className="mr-2 h-5 w-5"/> Finished the Week? Update Your Plan
                </Button>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <Dumbbell className="w-6 h-6 text-green-500"/>
                            <CardTitle>Workout Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Accordion type="single" collapsible className="w-full">
                                {workoutDays.map((day, index) => (
                                    <AccordionItem key={index} value={`item-${index}`}>
                                        <AccordionTrigger className="font-semibold">{day.day_of_week}: <span className="text-gray-600 font-normal ml-2">{day.focus}</span></AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-3 pl-2 border-l-2 border-green-200">
                                                {day.exercises?.map((ex, i) => (
                                                    <li key={i}>
                                                        <p className="font-medium">{ex.name}</p>
                                                        <p className="text-sm text-gray-500">Sets: {ex.sets} | Reps: {ex.reps} | Rest: {ex.rest || 'N/A'}</p>
                                                    </li>
                                                )) || <li className="text-gray-500">Rest Day</li>}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <Leaf className="w-6 h-6 text-green-500"/>
                            <CardTitle>Nutrition Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {nutritionDays.map((day, index) => (
                                    <AccordionItem key={index} value={`item-${index}`}>
                                        <AccordionTrigger className="font-semibold">{day.day_of_week}: <span className="text-gray-600 font-normal ml-2 flex items-center gap-1"><Flame className="w-4 h-4 text-orange-400" /> {day.daily_calories} kcal</span></AccordionTrigger>
                                        <AccordionContent className="space-y-4 pl-2 border-l-2 border-green-200">
                                            <div><h4 className="font-medium text-sm">Breakfast</h4><p className="text-gray-600">{day.meals.breakfast}</p></div>
                                            <div><h4 className="font-medium text-sm">Lunch</h4><p className="text-gray-600">{day.meals.lunch}</p></div>
                                            <div><h4 className="font-medium text-sm">Dinner</h4><p className="text-gray-600">{day.meals.dinner}</p></div>
                                            <div><h4 className="font-medium text-sm">Snacks</h4><p className="text-gray-600">{day.meals.snacks}</p></div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
                </>
            )}

            <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Weekly Check-in</DialogTitle>
                        <DialogDescription>Provide feedback to help your AI coach adapt your next plan.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>How was last week's workout difficulty?</Label>
                            <Select value={feedback.workout_difficulty} onValueChange={v => setFeedback({...feedback, workout_difficulty: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="too_easy">Too Easy</SelectItem>
                                    <SelectItem value="just_right">Just Right</SelectItem>
                                    <SelectItem value="too_hard">Too Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label>How much did you enjoy the plan? (1=Hated it, 5=Loved it)</Label>
                            <Select value={String(feedback.enjoyment_rating)} onValueChange={v => setFeedback({...feedback, enjoyment_rating: parseInt(v)})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{[1,2,3,4,5].map(r => <SelectItem key={r} value={String(r)}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Your current weight (kg)</Label>
                            <Input type="number" value={feedback.current_weight} onChange={e => setFeedback({...feedback, current_weight: e.target.value})} placeholder={`Last recorded: ${userProfile.weight} kg`} />
                        </div>
                        <div>
                            <Label>Any notes for your coach?</Label>
                            <Textarea value={feedback.progress_notes} onChange={e => setFeedback({...feedback, progress_notes: e.target.value})} placeholder="e.g., 'The squats hurt my knees', 'I'd like to try different meals', etc."/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
                        <Button onClick={() => generatePlan(feedback)}>Submit & Generate New Plan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
