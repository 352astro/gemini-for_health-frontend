
import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { Plus, User, Sparkles, Utensils, Dumbbell, BarChart3, List, Leaf, Wheat, Droplet, Activity } from "lucide-react";

import { UserProfile, DailyStats, MealItem, ActivityItem, TimelineItem, WeightRecord } from "./types";
import { INITIAL_STATS, INITIAL_PROFILE } from "./MockData";

// Components
import { RingProgress, ProgressBar, MealCard, ActivityCard } from "./SharedComponents";
import AddMealScreen from "./AddMealScreen";
import AddExerciseScreen from "./AddExerciseScreen";
import EditProfileScreen from "./EditProfileScreen";
import ProfileView from "./ProfileView";
import { AnalyticsView } from "./AnalyticsView";
import { WeightTrackerView } from "./WeightTrackerView";

const App = () => {
  const [stats, setStats] = useState<DailyStats>(INITIAL_STATS);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [exercises, setExercises] = useState<ActivityItem[]>([]);
  
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false); // For split FAB
  
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Weight Management State
  const [weight, setWeight] = useState(72.0);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([
      { date: '2023-10-01', weight: 75.0 },
      { date: '2023-10-15', weight: 74.2 },
      { date: '2023-11-01', weight: 73.5 },
      { date: '2023-11-10', weight: 72.8 },
      { date: '2023-11-14', weight: 72.0 }
  ]);
  const [isWeightTrackerOpen, setIsWeightTrackerOpen] = useState(false);

  const [suggestion, setSuggestion] = useState<string>("Ready to track! Add your first meal to get AI insights.");
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  
  const updateSuggestion = async (currentMeals: MealItem[], currentStats: DailyStats) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const lastMeal = currentMeals[0];
        if (!lastMeal) return;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user just added "${lastMeal.name}" (${lastMeal.calories}kcal) to their diet.
            Current Stats:
            Calories In: ${currentStats.calories.current}
            Calories Burned: ${currentStats.burned}
            Net Calories: ${currentStats.calories.current - currentStats.burned}
            Protein: ${currentStats.protein.current} / ${currentStats.protein.target}
            
            Provide a 1-sentence context-aware tip.`,
        });
        if (response.text) setSuggestion(response.text);
    } catch (e) { console.error(e); }
  };

  const handleAddMeals = (newMeals: MealItem[]) => {
    const updatedMeals = [...newMeals, ...meals];
    setMeals(updatedMeals);
    
    const addedStats = newMeals.reduce((acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const newStats = {
      ...stats,
      calories: { ...stats.calories, current: stats.calories.current + addedStats.calories },
      protein: { ...stats.protein, current: stats.protein.current + addedStats.protein },
      carbs: { ...stats.carbs, current: stats.carbs.current + addedStats.carbs },
      fat: { ...stats.fat, current: stats.fat.current + addedStats.fat },
    };
    
    setStats(newStats);
    setIsAddingMeal(false);
    updateSuggestion(updatedMeals, newStats);
  };

  const handleAddExercises = (newExercises: ActivityItem[]) => {
      const updatedEx = [...newExercises, ...exercises];
      setExercises(updatedEx);
      const burned = newExercises.reduce((acc, ex) => acc + ex.caloriesBurned, 0);
      setStats(prev => ({ ...prev, burned: prev.burned + burned }));
      setIsAddingExercise(false);
  };

  const handleSaveWeight = (newWeight: number) => {
      setWeight(newWeight);
      // Add to history
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // If today already exists, update it, else add new
      // Simplified for demo: Just push new
      setWeightHistory(prev => [...prev, { date: today, weight: newWeight }]);
      setIsWeightTrackerOpen(false);
  };

  // Merge and Sort Timeline
  const timeline: TimelineItem[] = [...meals, ...exercises].sort((a, b) => {
      return b.time.localeCompare(a.time); 
  });

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Header Background Layer - Moves up when in Chart mode */}
        <div className={`absolute top-0 left-0 w-full h-64 bg-emerald-500 rounded-b-[3rem] z-0 transition-transform duration-700 ease-in-out ${viewMode === 'chart' ? '-translate-y-full' : 'translate-y-0'}`}></div>
        <div className={`absolute -top-10 -right-10 w-40 h-40 bg-emerald-400 rounded-full blur-2xl opacity-50 z-0 transition-transform duration-700 ease-in-out ${viewMode === 'chart' ? '-translate-y-full' : 'translate-y-0'}`}></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          
          {/* Collapsible Header Group */}
          <div className={`shrink-0 overflow-hidden transition-all duration-700 ease-in-out ${viewMode === 'chart' ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
               <div className="p-6 pb-2">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center text-white mb-6 pt-2">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Tuesday, 14 Nov</p>
                            <h1 className="text-2xl font-bold">Hello, {userProfile.name.split(' ')[0]}</h1>
                        </div>
                        <button 
                            onClick={() => setShowProfile(true)}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/20"
                        >
                        <User size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Daily Summary Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-900/10 mb-4 animate-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Daily Net</h2>
                            <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">Target: {stats.calories.target}</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="shrink-0 relative">
                                <RingProgress current={stats.calories.current - stats.burned} target={stats.calories.target}>
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-0.5 text-emerald-500 mb-0.5">
                                            <span className="text-[10px] font-bold">+</span>
                                            <span className="text-xs font-bold">{Math.round(stats.calories.current)}</span>
                                        </div>
                                        <div className="relative">
                                            <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                                                {Math.round(stats.calories.current - stats.burned)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 text-orange-500 mt-0.5">
                                            <span className="text-[10px] font-bold">-</span>
                                            <span className="text-xs font-bold">{Math.round(stats.burned)}</span>
                                        </div>
                                    </div>
                                </RingProgress>
                            </div>
                            
                            <div className="flex-1 space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500 font-medium flex items-center gap-1"><Wheat size={12}/> Carbs</span>
                                        <span className="text-slate-800 font-bold">{Math.round(stats.carbs.current)}/{stats.carbs.target}g</span>
                                    </div>
                                    <ProgressBar current={stats.carbs.current} target={stats.carbs.target} colorClass="bg-amber-400" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500 font-medium flex items-center gap-1"><Droplet size={12}/> Fat</span>
                                        <span className="text-slate-800 font-bold">{Math.round(stats.fat.current)}/{stats.fat.target}g</span>
                                    </div>
                                    <ProgressBar current={stats.fat.current} target={stats.fat.target} colorClass="bg-rose-400" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500 font-medium flex items-center gap-1"><Activity size={12}/> Protein</span>
                                        <span className="text-slate-800 font-bold">{Math.round(stats.protein.current)}/{stats.protein.target}g</span>
                                    </div>
                                    <ProgressBar current={stats.protein.current} target={stats.protein.target} colorClass="bg-blue-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Insight */}
                    {suggestion && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-2 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 shrink-0"><Sparkles size={16} /></div>
                            <div>
                                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1">AI Insight</h3>
                                <p className="text-sm text-indigo-700 leading-snug">{suggestion}</p>
                            </div>
                        </div>
                    )}
               </div>
          </div>

          {/* Persistent Content - Stacked for Silk Transition */}
          <div className="flex-1 relative bg-slate-50 overflow-hidden">
             
             {/* Sticky Toggle Bar */}
             <div className="absolute top-0 left-0 right-0 z-30 px-6 pt-4 pb-2 bg-gradient-to-b from-slate-50 via-slate-50/90 to-transparent">
                 <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 transition-all duration-500">
                        {viewMode === 'list' ? 'Timeline' : 'Analytics'}
                    </h2>
                    <button 
                        onClick={() => setViewMode(viewMode === 'list' ? 'chart' : 'list')}
                        className="bg-white/80 backdrop-blur-md shadow-sm hover:bg-white text-slate-500 p-2 rounded-xl transition-all border border-slate-100/50"
                    >
                        {viewMode === 'list' ? <BarChart3 size={20} /> : <List size={20} />}
                    </button>
                 </div>
             </div>

             {/* View 1: Timeline - Fades out and slides away */}
             <div 
                className={`absolute inset-0 pt-20 px-6 pb-24 overflow-y-auto no-scrollbar transition-all duration-700 ease-in-out ${
                    viewMode === 'list' 
                    ? 'opacity-100 translate-y-0 scale-100 z-10' 
                    : 'opacity-0 translate-y-10 scale-95 z-0 pointer-events-none'
                }`}
             >
                <div className="space-y-2">
                  {timeline.length === 0 ? (
                     <div className="text-center py-10 opacity-50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Leaf className="text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-sm">No activity yet.<br/>Start your day!</p>
                     </div>
                  ) : (
                    timeline.map(item => (
                        item.itemType === 'meal' 
                        ? <MealCard key={item.id} meal={item as MealItem} />
                        : <ActivityCard key={item.id} activity={item as ActivityItem} />
                    ))
                  )}
                </div>
             </div>

             {/* View 2: Analytics - Fades in and slides up */}
             <div 
                className={`absolute inset-0 pt-20 px-6 pb-24 overflow-y-auto no-scrollbar transition-all duration-700 ease-in-out ${
                    viewMode === 'chart' 
                    ? 'opacity-100 translate-y-0 scale-100 z-10' 
                    : 'opacity-0 translate-y-10 scale-95 z-0 pointer-events-none'
                }`}
             >
                  <AnalyticsView currentMeals={meals} currentExercises={exercises} />
             </div>

          </div>
        </div>

        {/* Floating Action Button (Expandable) */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3">
            {isFabOpen && (
                <>
                    <button 
                        onClick={() => { setIsAddingExercise(true); setIsFabOpen(false); }}
                        className="bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-200"
                    >
                        <span className="text-sm font-bold">Exercise</span>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Dumbbell size={16}/></div>
                    </button>
                    <button 
                        onClick={() => { setIsAddingMeal(true); setIsFabOpen(false); }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200"
                    >
                        <span className="text-sm font-bold">Food</span>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Utensils size={16}/></div>
                    </button>
                </>
            )}
          
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-full shadow-lg shadow-emerald-900/20 flex items-center justify-center text-white transition-all active:scale-90 ${isFabOpen ? 'bg-slate-800 rotate-45' : 'bg-emerald-600'}`}
          >
            <Plus size={28} />
          </button>
        </div>

        {/* Overlays */}
        {isAddingMeal && <AddMealScreen onClose={() => setIsAddingMeal(false)} onAdd={handleAddMeals} currentStats={stats} />}
        {isAddingExercise && <AddExerciseScreen onClose={() => setIsAddingExercise(false)} onAdd={handleAddExercises} />}
        
        {showProfile && (
            <ProfileView 
                onClose={() => setShowProfile(false)} 
                stats={stats} 
                weight={weight}
                profile={userProfile}
                onOpenWeight={() => setIsWeightTrackerOpen(true)}
                onEditProfile={() => setIsEditingProfile(true)}
            />
        )}
        
        {isEditingProfile && (
            <EditProfileScreen 
                profile={userProfile}
                onClose={() => setIsEditingProfile(false)}
                onSave={setUserProfile}
            />
        )}

        {/* Weight Tracker Overlay (Launched from Profile) */}
        {isWeightTrackerOpen && (
            <WeightTrackerView 
                currentWeight={weight}
                height={userProfile.height}
                history={weightHistory}
                onClose={() => setIsWeightTrackerOpen(false)}
                onSave={handleSaveWeight}
            />
        )}

      </div>
    </div>
  );
};

export default App;
