import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";
import { Plus, Flame, ChevronRight, PieChart, Activity, X, Loader2, Leaf, Droplet, Wheat, User, Settings, ChevronLeft, Ruler, Weight, Target, Sparkles, Search, Check, Trash2, ArrowUpRight, Minus, ChevronUp, ChevronDown, ShoppingBag, Scale, Utensils, PenTool, Dumbbell, Timer, Zap, Bike, Footprints, BarChart3, List } from "lucide-react";

// --- Types ---

interface Macro {
  current: number;
  target: number;
  unit: string;
}

interface DailyStats {
  calories: Macro;
  protein: Macro;
  carbs: Macro;
  fat: Macro;
  burned: number; // New: Track calories burned
}

interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  image?: string;
  itemType: 'meal'; // Discriminator
}

interface ActivityItem {
  id: string;
  name: string;
  caloriesBurned: number;
  duration: number; // minutes
  time: string;
  type: "Cardio" | "Strength" | "Flexibility" | "Sports";
  image?: string;
  itemType: 'exercise'; // Discriminator
}

type TimelineItem = MealItem | ActivityItem;

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  gramsPerUnit: number; // Weight in grams for 1 'unit'
  image: string;
}

interface ExerciseItem {
  id: string;
  name: string;
  caloriesPerUnit: number; // Calories burned per minute (usually)
  unit: string; // 'min', 'set'
  image: string;
  category: "Cardio" | "Strength" | "Flexibility" | "Sports";
}

interface SelectedFoodItem extends FoodItem {
    count: number | string; 
    mode: 'unit' | 'gram';
}

interface SelectedExerciseItem extends ExerciseItem {
    count: number | string; // Duration in minutes usually
}

// --- Mock Data & Init ---

const INITIAL_STATS: DailyStats = {
  calories: { current: 0, target: 2200, unit: "kcal" },
  protein: { current: 0, target: 150, unit: "g" },
  carbs: { current: 0, target: 250, unit: "g" },
  fat: { current: 0, target: 70, unit: "g" },
  burned: 0,
};

const FOOD_DB: FoodItem[] = [
  { id: '1', name: 'Boiled Egg', calories: 78, protein: 6, carbs: 0.6, fat: 5, unit: '1 large', gramsPerUnit: 50, image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=150&q=80' },
  { id: '2', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: '100g', gramsPerUnit: 100, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=150&q=80' },
  { id: '3', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, unit: '1 cup cooked', gramsPerUnit: 234, image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=150&q=80' },
  { id: '4', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, unit: '1 medium', gramsPerUnit: 118, image: 'https://images.unsplash.com/photo-1571771896331-1041621c310f?w=150&q=80' },
  { id: '5', name: 'Rice (White)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: '100g', gramsPerUnit: 100, image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=150&q=80' },
  { id: '6', name: 'Avocado', calories: 160, protein: 2, carbs: 8.5, fat: 15, unit: '1/2 fruit', gramsPerUnit: 100, image: 'https://images.unsplash.com/photo-1523049673856-4287bf676329?w=150&q=80' },
  { id: '7', name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, unit: '100g', gramsPerUnit: 100, image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=150&q=80' },
  { id: '8', name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 3.6, fat: 0, unit: '1 cup', gramsPerUnit: 245, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&q=80' },
  { id: '9', name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, unit: '1 oz', gramsPerUnit: 28, image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d61?w=150&q=80' },
  { id: '10', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, unit: '1 medium', gramsPerUnit: 182, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=150&q=80' },
  { id: '11', name: 'Whole Wheat Bread', calories: 80, protein: 4, carbs: 13, fat: 1, unit: '1 slice', gramsPerUnit: 43, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&q=80' },
  { id: '12', name: 'Peanut Butter', calories: 190, protein: 8, carbs: 6, fat: 16, unit: '2 tbsp', gramsPerUnit: 32, image: 'https://images.unsplash.com/photo-1514660882326-89c09641753b?w=150&q=80' },
  { id: '13', name: 'Caesar Salad', calories: 350, protein: 12, carbs: 15, fat: 28, unit: '1 bowl', gramsPerUnit: 300, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=150&q=80' },
  { id: '14', name: 'Protein Shake', calories: 120, protein: 25, carbs: 3, fat: 1, unit: '1 scoop', gramsPerUnit: 30, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=150&q=80' },
  { id: '15', name: 'Sweet Potato', calories: 112, protein: 2, carbs: 26, fat: 0.1, unit: '1 medium', gramsPerUnit: 130, image: 'https://images.unsplash.com/photo-1596097635121-14b63b8a66cf?w=150&q=80' },
];

const EXERCISE_DB: ExerciseItem[] = [
    { id: 'e1', name: 'Running (Moderate)', caloriesPerUnit: 11, unit: 'min', category: 'Cardio', image: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=150&q=80' },
    { id: 'e2', name: 'Cycling (Indoor)', caloriesPerUnit: 7, unit: 'min', category: 'Cardio', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&q=80' },
    { id: 'e3', name: 'Weight Lifting', caloriesPerUnit: 6, unit: 'min', category: 'Strength', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=150&q=80' },
    { id: 'e4', name: 'Yoga', caloriesPerUnit: 4, unit: 'min', category: 'Flexibility', image: 'https://images.unsplash.com/photo-1544367563-12123d8966cd?w=150&q=80' },
    { id: 'e5', name: 'Swimming', caloriesPerUnit: 10, unit: 'min', category: 'Cardio', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=150&q=80' },
    { id: 'e6', name: 'HIIT Workout', caloriesPerUnit: 13, unit: 'min', category: 'Cardio', image: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=150&q=80' },
    { id: 'e7', name: 'Walking (Brisk)', caloriesPerUnit: 4, unit: 'min', category: 'Cardio', image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=150&q=80' },
    { id: 'e8', name: 'Basketball', caloriesPerUnit: 8, unit: 'min', category: 'Sports', image: 'https://images.unsplash.com/photo-1546519638-68e109498ee3?w=150&q=80' },
    { id: 'e9', name: 'Jump Rope', caloriesPerUnit: 12, unit: 'min', category: 'Cardio', image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=150&q=80' },
    { id: 'e10', name: 'Pilates', caloriesPerUnit: 5, unit: 'min', category: 'Flexibility', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=150&q=80' },
];

// --- Components ---

const ProgressBar: React.FC<{ current: number; target: number; colorClass: string }> = ({ current, target, colorClass }) => {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const RingProgress: React.FC<{ current: number; target: number; children: React.ReactNode }> = ({ current, target, children }) => {
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const isNegative = current < 0;
  // If negative (burned > intake), we show orange and fill counter-clockwise
  const absValue = Math.abs(current);
  const percent = Math.min(100, Math.max(0, (absValue / target) * 100));
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const strokeColor = isNegative ? "#f97316" : "#10b981"; // Orange-500 : Emerald-500

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Container 
          -rotate-90 makes it start at 12 o'clock.
          -scale-x-100 flips it horizontally to make the draw direction counter-clockwise if negative.
      */}
      <svg 
        height={radius * 2} 
        width={radius * 2} 
        className={`transform -rotate-90 ${isNegative ? '-scale-x-100' : ''} transition-transform duration-500`}
      >
        <circle
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease" }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-700">
        {children}
      </div>
    </div>
  );
};

const MealCard: React.FC<{ meal: MealItem }> = ({ meal }) => (
  <div className="flex items-center p-4 mb-3 bg-white rounded-2xl shadow-sm border border-slate-50 transition-all hover:shadow-md">
    <div className={`w-12 h-12 rounded-xl mr-4 overflow-hidden shrink-0 flex items-center justify-center ${
      !meal.image ? (
        meal.type === 'Breakfast' ? 'bg-orange-100 text-orange-600' :
        meal.type === 'Lunch' ? 'bg-blue-100 text-blue-600' :
        meal.type === 'Dinner' ? 'bg-indigo-100 text-indigo-600' :
        'bg-emerald-100 text-emerald-600'
      ) : 'bg-slate-100'
    }`}>
      {meal.image ? (
          <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
      ) : (
        meal.type === 'Breakfast' ? <Flame size={20} /> :
        meal.type === 'Lunch' ? <Activity size={20} /> :
        meal.type === 'Dinner' ? <PieChart size={20} /> :
        <Leaf size={20} />
      )}
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-slate-800 text-sm">{meal.name}</h3>
      <p className="text-xs text-slate-500">{meal.time} • {meal.type}</p>
    </div>
    <div className="text-right">
      <span className="block font-bold text-slate-700">{Math.round(meal.calories)}</span>
      <span className="text-xs text-slate-400">kcal</span>
    </div>
  </div>
);

const ActivityCard: React.FC<{ activity: ActivityItem }> = ({ activity }) => (
    <div className="flex items-center p-4 mb-3 bg-white rounded-2xl shadow-sm border border-orange-50 relative overflow-hidden transition-all hover:shadow-md">
        {/* Decorative indicator */}
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-orange-400 rounded-r-full"></div>
        
        <div className="w-12 h-12 rounded-xl mr-4 overflow-hidden shrink-0 flex items-center justify-center bg-orange-100 text-orange-600 ml-2">
            {activity.image ? (
                 <img src={activity.image} alt={activity.name} className="w-full h-full object-cover" />
            ) : (
                <Dumbbell size={20} />
            )}
        </div>
        <div className="flex-1">
            <h3 className="font-semibold text-slate-800 text-sm">{activity.name}</h3>
            <p className="text-xs text-slate-500">{activity.time} • {activity.type}</p>
        </div>
        <div className="text-right">
            <span className="block font-bold text-orange-500">-{Math.round(activity.caloriesBurned)}</span>
            <span className="text-xs text-orange-300">kcal</span>
        </div>
    </div>
);

const StatsView: React.FC<{ meals: MealItem[], exercises: ActivityItem[] }> = ({ meals, exercises }) => {
    // 1. Macros Data
    const macros = meals.reduce((acc, m) => ({
        p: acc.p + m.protein,
        c: acc.c + m.carbs,
        f: acc.f + m.fat,
    }), { p: 0, c: 0, f: 0 });
    
    // Convert to calories for ratio (Protein/Carbs = 4kcal, Fat = 9kcal)
    const pCal = macros.p * 4;
    const cCal = macros.c * 4;
    const fCal = macros.f * 9;
    const totalMacroCal = pCal + cCal + fCal || 1; // avoid divide by 0
    
    // Conic gradient segments
    const pPct = (pCal / totalMacroCal) * 100;
    const cPct = (cCal / totalMacroCal) * 100;
    const fPct = (fCal / totalMacroCal) * 100;
    
    // 2. Meal Type Data
    const mealTypes = meals.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + m.calories;
        return acc;
    }, {} as Record<string, number>);
    const maxMealCal = Math.max(...Object.values(mealTypes), 1);

    // 3. Balance Data
    const totalIn = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalBurn = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
    const maxBalance = Math.max(totalIn, totalBurn, 100);

    return (
        <div className="space-y-4">
            {/* Calories Balance Bar Chart */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Scale size={18} className="text-slate-400"/> Calorie Balance
                </h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>In (Food)</span>
                            <span className="font-bold text-emerald-600">{Math.round(totalIn)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(totalIn / maxBalance) * 100}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Out (Exercise)</span>
                            <span className="font-bold text-orange-500">{Math.round(totalBurn)}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(totalBurn / maxBalance) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Macro Ratio (Donut) */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex flex-col items-center">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Macro Ratio</h3>
                    <div className="relative w-28 h-28 rounded-full mb-3"
                         style={{
                            background: `conic-gradient(
                                #60a5fa 0% ${pPct}%, 
                                #fbbf24 ${pPct}% ${pPct + cPct}%, 
                                #fb7185 ${pPct + cPct}% 100%
                            )`
                         }}>
                         <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                             <span className="text-[10px] text-slate-400 font-medium">Caloric</span>
                             <span className="text-xs font-bold text-slate-700">Split</span>
                         </div>
                    </div>
                    <div className="w-full text-[10px] space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Protein</span>
                            <span className="font-semibold">{Math.round(pPct)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Carbs</span>
                            <span className="font-semibold">{Math.round(cPct)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Fat</span>
                            <span className="font-semibold">{Math.round(fPct)}%</span>
                        </div>
                    </div>
                </div>

                {/* Meal Sources (Vertical Bars) */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Sources</h3>
                    <div className="flex justify-between items-end h-32 px-1">
                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => {
                             const val = mealTypes[type as any] || 0;
                             const pct = (val / maxMealCal) * 100;
                             return (
                                 <div key={type} className="flex flex-col items-center gap-1 group w-1/4">
                                     <div className="w-full bg-slate-100 rounded-t-lg relative flex items-end justify-center overflow-hidden" style={{height: '100%'}}>
                                        <div 
                                            className={`w-full transition-all duration-500 ${
                                                type === 'Breakfast' ? 'bg-orange-300' :
                                                type === 'Lunch' ? 'bg-blue-300' :
                                                type === 'Dinner' ? 'bg-indigo-300' : 'bg-emerald-300'
                                            }`} 
                                            style={{ height: `${pct}%` }}
                                        ></div>
                                     </div>
                                     <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">{type.substr(0, 3)}</span>
                                 </div>
                             )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileView: React.FC<{ onClose: () => void; stats: DailyStats }> = ({ onClose, stats }) => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Profile Header */}
        <div className="bg-emerald-600 pb-8 pt-12 rounded-b-[3rem] shadow-xl relative overflow-hidden shrink-0">
           {/* Decorative blobs */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-400 rounded-full blur-2xl opacity-30 translate-y-1/2 -translate-x-1/4"></div>

           <div className="relative z-10 px-6">
               <button 
                onClick={onClose} 
                className="absolute top-0 left-6 p-2 bg-white/20 rounded-full backdrop-blur-md hover:bg-white/30 text-white transition-colors"
               >
                 <ChevronLeft size={24} />
               </button>
               
               <div className="flex flex-col items-center mt-2">
                 <div className="w-28 h-28 bg-white p-1 rounded-full shadow-lg mb-4">
                   <img 
                     src="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" 
                     alt="Profile" 
                     className="w-full h-full rounded-full bg-slate-100" 
                    />
                 </div>
                 <h2 className="text-2xl font-bold text-white">Alex Johnson</h2>
                 <p className="text-emerald-100 font-medium">Keep Fit Program</p>
               </div>

               {/* Bio Stats */}
               <div className="flex justify-between mt-8 px-2 max-w-xs mx-auto">
                  <div className="text-center">
                     <span className="text-2xl font-bold text-white block">72</span>
                     <span className="text-xs text-emerald-200 uppercase tracking-wide flex items-center justify-center gap-1">
                        <Weight size={10} /> kg
                     </span>
                  </div>
                  <div className="w-px bg-emerald-500/50"></div>
                  <div className="text-center">
                     <span className="text-2xl font-bold text-white block">178</span>
                     <span className="text-xs text-emerald-200 uppercase tracking-wide flex items-center justify-center gap-1">
                        <Ruler size={10} /> cm
                     </span>
                  </div>
                  <div className="w-px bg-emerald-500/50"></div>
                  <div className="text-center">
                     <span className="text-2xl font-bold text-white block">26</span>
                     <span className="text-xs text-emerald-200 uppercase tracking-wide">Years</span>
                  </div>
               </div>
           </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Goals Section */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Target size={20} className="text-emerald-500"/> Daily Goals
                    </h3>
                    <button className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full">Edit</button>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <span className="text-slate-500 text-sm">Calories Limit</span>
                        <span className="font-bold text-slate-800">{stats.calories.target} kcal</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <span className="text-slate-500 text-sm">Protein Goal</span>
                        <span className="font-bold text-slate-800">{stats.protein.target} g</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <span className="text-slate-500 text-sm">Carbs Goal</span>
                        <span className="font-bold text-slate-800">{stats.carbs.target} g</span>
                    </div>
                </div>
            </div>
            
            {/* Stats Summary */}
            <div className="bg-orange-50 p-5 rounded-3xl shadow-sm border border-orange-100">
                <div className="flex items-center justify-between mb-2">
                     <h3 className="font-bold text-orange-900 text-lg flex items-center gap-2">
                        <Flame size={20} className="text-orange-500"/> Burned Today
                    </h3>
                </div>
                <p className="text-3xl font-black text-orange-500">{Math.round(stats.burned)} <span className="text-base font-normal text-orange-400">kcal</span></p>
                <p className="text-xs text-orange-400 mt-1">Keep moving to reach your goals!</p>
            </div>

            {/* Menu Items */}
            <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <span className="font-semibold text-slate-700">Activity Log</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                            <Settings size={20} />
                        </div>
                        <span className="font-semibold text-slate-700">Settings</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </button>
            </div>
        </div>
    </div>
  );
};

// --- Helper Interface for Custom Food Form ---
interface CustomFoodForm {
  name: string;
  unitName: string;
  weightPerUnit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

// --- Helper Interface for Custom Exercise Form ---
interface CustomExerciseForm {
  name: string;
  caloriesPerMin: string;
}

const AddMealScreen: React.FC<{ 
    onClose: () => void; 
    onAdd: (items: MealItem[]) => void;
    currentStats: DailyStats;
}> = ({ onClose, onAdd, currentStats }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">(() => {
        const hour = new Date().getHours();
        if (hour < 11) return "Breakfast";
        if (hour < 15) return "Lunch";
        if (hour < 19) return "Dinner";
        return "Snack";
    });
    
    // Manage Selected Items with Quantities
    const [selectedItems, setSelectedItems] = useState<SelectedFoodItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Custom Food Modal State
    const [isCustomFoodOpen, setIsCustomFoodOpen] = useState(false);
    const [customForm, setCustomForm] = useState<CustomFoodForm>({
        name: '', unitName: '1 serving', weightPerUnit: '100',
        calories: '', protein: '', carbs: '', fat: ''
    });
    const [aiAutoFillInput, setAiAutoFillInput] = useState("");
    const [isAiAutoFilling, setIsAiAutoFilling] = useState(false);
    const [showAiInput, setShowAiInput] = useState(false);

    const filteredFood = FOOD_DB.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addToCart = (item: FoodItem) => {
        setSelectedItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                // If adding same item, just increment count in current mode
                const numericCount = parseFloat(existing.count.toString()) || 0;
                const increment = existing.mode === 'gram' ? 10 : 1;
                return prev.map(i => i.id === item.id ? { ...i, count: numericCount + increment } : i);
            }
            return [...prev, { ...item, count: 1, mode: 'unit' }];
        });
    };

    const toggleMode = (id: string) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                const currentCount = parseFloat(item.count.toString()) || 0;
                const newMode = item.mode === 'unit' ? 'gram' : 'unit';
                let newCount = 0;
                
                // Conversion Logic
                if (newMode === 'gram') {
                    // Unit -> Gram
                    newCount = Math.round(currentCount * item.gramsPerUnit);
                } else {
                    // Gram -> Unit
                    newCount = Math.round((currentCount / item.gramsPerUnit) * 10) / 10;
                }
                
                // Safety catch for zero
                if (newCount <= 0) newCount = newMode === 'gram' ? 10 : 0.5;

                return { ...item, mode: newMode, count: newCount };
            }
            return item;
        }));
    };

    const updateQuantity = (id: string, delta: number) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                const currentCount = parseFloat(item.count.toString()) || 0;
                const minVal = item.mode === 'gram' ? 1 : 0.5;
                const newCount = Math.max(minVal, currentCount + delta);
                return { ...item, count: parseFloat(newCount.toFixed(1)) };
            }
            return item;
        }));
    };

    const handleInputChange = (id: string, value: string) => {
        // Allow numeric inputs and empty string (for deleting)
        if (/^(\d*\.?\d*)$/.test(value)) {
             setSelectedItems(prev => prev.map(item => {
                if (item.id === id) {
                    return { ...item, count: value };
                }
                return item;
            }));
        }
    };

    const handleInputBlur = (id: string) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                // Parse float from string, if fail revert to default
                let val = parseFloat(item.count.toString());
                if (isNaN(val) || val <= 0) {
                     val = item.mode === 'gram' ? 10 : 1;
                }
                return { ...item, count: val };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setSelectedItems(prev => prev.filter(item => item.id !== id));
        if (selectedItems.length <= 1) setIsCartOpen(false);
    };

    const calculateItemMacros = (item: SelectedFoodItem) => {
        const count = parseFloat(item.count.toString()) || 0;
        const ratio = item.mode === 'gram' 
            ? count / item.gramsPerUnit 
            : count;
        
        return {
            calories: item.calories * ratio,
            protein: item.protein * ratio,
            carbs: item.carbs * ratio,
            fat: item.fat * ratio
        };
    };

    const handleSave = () => {
        const newMeals: MealItem[] = selectedItems.map(item => {
            const macros = calculateItemMacros(item);
            return {
                id: Date.now().toString() + Math.random().toString(),
                name: item.name,
                calories: macros.calories,
                protein: macros.protein,
                carbs: macros.carbs,
                fat: macros.fat,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: selectedType,
                image: item.image,
                itemType: 'meal'
            };
        });
        onAdd(newMeals);
        onClose();
    };

    const handleAiAutoFill = async () => {
        if (!aiAutoFillInput.trim()) return;
        setIsAiAutoFilling(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Analyze this food description: "${aiAutoFillInput}". 
                Identify the likely food name, standard unit name (e.g. '1 bowl', '1 slice'), estimated weight in grams for that unit, and nutritional info for ONE unit.
                Return raw JSON only. 
                Structure: {
                  "name": string,
                  "unit_name": string,
                  "weight_per_unit_g": number,
                  "calories": number,
                  "protein": number,
                  "carbs": number,
                  "fat": number
                }`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            unit_name: { type: Type.STRING },
                            weight_per_unit_g: { type: Type.NUMBER },
                            calories: { type: Type.NUMBER },
                            protein: { type: Type.NUMBER },
                            carbs: { type: Type.NUMBER },
                            fat: { type: Type.NUMBER },
                        }
                    }
                }
            });
            const data = JSON.parse(response.text || "{}");
            if (data.name) {
                setCustomForm({
                    name: data.name,
                    unitName: data.unit_name || '1 serving',
                    weightPerUnit: (data.weight_per_unit_g || 100).toString(),
                    calories: (data.calories || 0).toString(),
                    protein: (data.protein || 0).toString(),
                    carbs: (data.carbs || 0).toString(),
                    fat: (data.fat || 0).toString(),
                });
                setShowAiInput(false);
                setAiAutoFillInput("");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to analyze.");
        } finally {
            setIsAiAutoFilling(false);
        }
    };

    const handleSaveCustomFood = () => {
        if (!customForm.name) {
            alert("Please enter a food name");
            return;
        }
        const newFood: FoodItem = {
            id: 'custom-' + Date.now(),
            name: customForm.name,
            unit: customForm.unitName || '1 serving',
            gramsPerUnit: parseFloat(customForm.weightPerUnit) || 100,
            calories: parseFloat(customForm.calories) || 0,
            protein: parseFloat(customForm.protein) || 0,
            carbs: parseFloat(customForm.carbs) || 0,
            fat: parseFloat(customForm.fat) || 0,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&q=80' // Generic placeholder
        };
        addToCart(newFood);
        setIsCustomFoodOpen(false);
        // Reset form
        setCustomForm({
            name: '', unitName: '1 serving', weightPerUnit: '100',
            calories: '', protein: '', carbs: '', fat: ''
        });
        setIsCartOpen(true);
    };

    const totalSelectedCalories = selectedItems.reduce((acc, i) => acc + calculateItemMacros(i).calories, 0);

    return (
        <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-4 shadow-sm z-10 sticky top-0 shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">Add Food</h2>
                    <div className="w-8"></div> {/* Spacer */}
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Search for food..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>

                {/* Meal Type Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {["Breakfast", "Lunch", "Dinner", "Snack"].map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type as any)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                                selectedType === type 
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Content */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-3 pb-32`}>
                
                {/* Custom Food Creation Button */}
                <button 
                    onClick={() => setIsCustomFoodOpen(true)}
                    className="w-full bg-indigo-50 border border-indigo-100 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 text-indigo-600 font-semibold mb-4 hover:bg-indigo-100 transition-colors"
                >
                    <PenTool size={18} />
                    Create Custom Food
                </button>

                {/* Filtered List */}
                {filteredFood.map(item => {
                    const existing = selectedItems.find(i => i.id === item.id);
                    const count = existing ? parseFloat(existing.count.toString()) : 0;
                    
                    return (
                        <div 
                            key={item.id}
                            className={`flex items-center p-3 rounded-2xl border transition-all ${
                                count > 0
                                ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                                : "bg-white border-transparent shadow-sm hover:border-slate-200"
                            }`}
                        >
                            {/* Food Image */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden mr-4 shrink-0 bg-slate-100">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1">
                                <h3 className={`font-semibold ${count > 0 ? "text-emerald-900" : "text-slate-800"}`}>
                                    {item.name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {item.calories} kcal • {item.unit}
                                </p>
                            </div>
                            
                            {count > 0 ? (
                                <div className="flex items-center gap-2 animate-in zoom-in duration-200">
                                     <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
                                        x{count} {existing?.mode === 'gram' ? 'g' : ''}
                                     </span>
                                     <button 
                                        onClick={() => addToCart(item)}
                                        className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center active:scale-90 transition-transform"
                                     >
                                         <Plus size={16} />
                                     </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => addToCart(item)}
                                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors active:scale-90"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>
                    )
                })}

                {filteredFood.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <Search size={32} className="mx-auto mb-3 opacity-30" />
                        <p>No food found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>

            {/* CUSTOM FOOD MODAL */}
            {isCustomFoodOpen && (
                <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
                     <div className="px-6 pt-12 pb-4 border-b border-slate-50 flex items-center gap-3">
                         <button onClick={() => setIsCustomFoodOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                             <ChevronLeft size={24} className="text-slate-500"/>
                         </button>
                         <h2 className="text-xl font-bold text-slate-800">Create Custom Food</h2>
                     </div>

                     <div className="flex-1 overflow-y-auto p-6">
                         
                         {/* AI Auto-Fill Toggle */}
                         <div className="mb-8">
                             {!showAiInput ? (
                                 <button 
                                    onClick={() => setShowAiInput(true)}
                                    className="text-sm font-semibold text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                                 >
                                     <Sparkles size={16} /> Auto-fill with AI
                                 </button>
                             ) : (
                                 <div className="bg-indigo-50 p-4 rounded-2xl animate-in fade-in">
                                     <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-indigo-800 uppercase">AI Magic Fill</label>
                                        <button onClick={() => setShowAiInput(false)} className="text-indigo-400 hover:text-indigo-600"><X size={14}/></button>
                                     </div>
                                     <textarea 
                                        value={aiAutoFillInput}
                                        onChange={(e) => setAiAutoFillInput(e.target.value)}
                                        placeholder="e.g. 2 slices of pepperoni pizza"
                                        className="w-full bg-white rounded-xl p-3 text-sm text-indigo-900 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        rows={2}
                                     />
                                     <button 
                                        onClick={handleAiAutoFill}
                                        disabled={isAiAutoFilling || !aiAutoFillInput.trim()}
                                        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2"
                                     >
                                        {isAiAutoFilling ? <Loader2 className="animate-spin" size={14}/> : <><Sparkles size={14}/> Auto-fill Form</>}
                                     </button>
                                 </div>
                             )}
                         </div>

                         {/* Form */}
                         <div className="space-y-5">
                             <div>
                                 <label className="block text-sm font-medium text-slate-500 mb-1">Food Name</label>
                                 <input 
                                    type="text" 
                                    value={customForm.name}
                                    onChange={(e) => setCustomForm({...customForm, name: e.target.value})}
                                    placeholder="e.g. Grandma's Apple Pie"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                 />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Serving Unit</label>
                                    <input 
                                        type="text" 
                                        value={customForm.unitName}
                                        onChange={(e) => setCustomForm({...customForm, unitName: e.target.value})}
                                        placeholder="e.g. 1 bowl"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Weight (g)</label>
                                    <input 
                                        type="number" 
                                        value={customForm.weightPerUnit}
                                        onChange={(e) => setCustomForm({...customForm, weightPerUnit: e.target.value})}
                                        placeholder="100"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                             </div>

                             <div className="pt-4 border-t border-slate-100">
                                 <label className="block text-sm font-bold text-slate-800 mb-4">Nutrition per Serving (or Unit)</label>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Calories (kcal)</label>
                                        <input 
                                            type="number" 
                                            value={customForm.calories}
                                            onChange={(e) => setCustomForm({...customForm, calories: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Protein (g)</label>
                                        <input 
                                            type="number" 
                                            value={customForm.protein}
                                            onChange={(e) => setCustomForm({...customForm, protein: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Carbs (g)</label>
                                        <input 
                                            type="number" 
                                            value={customForm.carbs}
                                            onChange={(e) => setCustomForm({...customForm, carbs: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Fat (g)</label>
                                        <input 
                                            type="number" 
                                            value={customForm.fat}
                                            onChange={(e) => setCustomForm({...customForm, fat: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                 </div>
                             </div>
                         </div>
                     </div>

                     <div className="p-6 border-t border-slate-50 bg-white">
                         <button 
                            onClick={handleSaveCustomFood}
                            className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 shadow-lg active:scale-[0.98] transition-all"
                         >
                             Save & Add to Cart
                         </button>
                     </div>
                </div>
            )}

            {/* Collapsible Cart Bottom Sheet */}
            {selectedItems.length > 0 && !isCustomFoodOpen && (
                <>
                    {/* Backdrop when open */}
                    {isCartOpen && (
                        <div 
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30 animate-in fade-in"
                            onClick={() => setIsCartOpen(false)}
                        />
                    )}

                    <div className={`absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out flex flex-col ${isCartOpen ? 'h-[75%]' : 'h-24'}`}>
                        
                        {/* Cart Handle / Summary Bar */}
                        <div 
                            className="px-6 py-4 flex items-center justify-between cursor-pointer border-b border-slate-50"
                            onClick={() => setIsCartOpen(!isCartOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                        {selectedItems.length}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Selected</p>
                                    <p className="text-lg font-bold text-slate-800 leading-none">
                                        {Math.round(totalSelectedCalories)} <span className="text-xs font-normal text-slate-400">kcal</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isCartOpen && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleSave(); }}
                                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                                    >
                                        Add Now
                                    </button>
                                )}
                                <div className="p-2 text-slate-400">
                                    {isCartOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                </div>
                            </div>
                        </div>

                        {/* Expanded List Content */}
                        <div className={`flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 ${!isCartOpen && 'hidden'}`}>
                            {selectedItems.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 animate-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            {/* Cart Item Image */}
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{item.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {/* Unit Switcher */}
                                                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                                                        <button 
                                                            onClick={() => item.mode === 'gram' && toggleMode(item.id)}
                                                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                                                                item.mode === 'unit' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'
                                                            }`}
                                                        >
                                                            {item.unit}
                                                        </button>
                                                        <button 
                                                            onClick={() => item.mode === 'unit' && toggleMode(item.id)}
                                                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                                                                item.mode === 'gram' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'
                                                            }`}
                                                        >
                                                            Grams (g)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeItem(item.id)}
                                            className="text-rose-400 hover:text-rose-600 p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2">
                                        <div className="text-sm font-semibold text-slate-600 pl-2">
                                            {Math.round(calculateItemMacros(item).calories)} kcal
                                        </div>
                                        
                                        {/* Dynamic Input Control */}
                                        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-1 py-1">
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.mode === 'gram' ? -10 : -0.5)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            
                                            {/* Input for BOTH Gram and Unit modes */}
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    inputMode="decimal"
                                                    step={item.mode === 'gram' ? "1" : "0.5"}
                                                    value={item.count}
                                                    onChange={(e) => handleInputChange(item.id, e.target.value)}
                                                    onBlur={() => handleInputBlur(item.id)}
                                                    className="w-16 text-center font-bold text-slate-800 focus:outline-none focus:text-emerald-600 bg-transparent"
                                                />
                                                {item.mode === 'gram' && (
                                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-300 pointer-events-none pr-0.5">g</span>
                                                )}
                                            </div>
                                            
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.mode === 'gram' ? 10 : 0.5)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Expanded Bottom Action */}
                        {isCartOpen && (
                            <div className="p-6 bg-white border-t border-slate-50 pb-8">
                                <button 
                                    onClick={handleSave}
                                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    Confirm & Add {selectedItems.length} items
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// --- Add Exercise Screen ---
const AddExerciseScreen: React.FC<{ 
    onClose: () => void; 
    onAdd: (items: ActivityItem[]) => void;
}> = ({ onClose, onAdd }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<"Cardio" | "Strength" | "Flexibility" | "Sports">("Cardio");
    const [selectedItems, setSelectedItems] = useState<SelectedExerciseItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Custom Exercise State
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const [customForm, setCustomForm] = useState<CustomExerciseForm>({ name: '', caloriesPerMin: '' });
    const [aiInput, setAiInput] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showAi, setShowAi] = useState(false);

    const filteredExercises = EXERCISE_DB.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        (searchQuery ? true : item.category === selectedCategory)
    );

    const addToCart = (item: ExerciseItem) => {
        setSelectedItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                const numericCount = parseFloat(existing.count.toString()) || 0;
                return prev.map(i => i.id === item.id ? { ...i, count: numericCount + 15 } : i);
            }
            return [...prev, { ...item, count: 30 }]; // Default 30 mins
        });
    };

    const updateDuration = (id: string, delta: number) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                const current = parseFloat(item.count.toString()) || 0;
                const newVal = Math.max(5, current + delta);
                return { ...item, count: newVal };
            }
            return item;
        }));
    };

    const handleInputChange = (id: string, value: string) => {
         if (/^\d*$/.test(value)) {
             setSelectedItems(prev => prev.map(item => item.id === id ? { ...item, count: value } : item));
         }
    };

    const handleInputBlur = (id: string) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                let val = parseFloat(item.count.toString());
                if (isNaN(val) || val <= 0) val = 30;
                return { ...item, count: val };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setSelectedItems(prev => prev.filter(item => item.id !== id));
        if (selectedItems.length <= 1) setIsCartOpen(false);
    };

    const handleSave = () => {
        const newActivities: ActivityItem[] = selectedItems.map(item => {
            const duration = parseFloat(item.count.toString()) || 0;
            return {
                id: Date.now().toString() + Math.random().toString(),
                name: item.name,
                caloriesBurned: item.caloriesPerUnit * duration,
                duration: duration,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: item.category,
                image: item.image,
                itemType: 'exercise'
            };
        });
        onAdd(newActivities);
        onClose();
    };

    const handleAiAutoFill = async () => {
        if (!aiInput.trim()) return;
        setIsAiLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Analyze this exercise: "${aiInput}". Identify the exercise name and estimated calories burned per minute. Return raw JSON. Structure: { "name": string, "calories_per_min": number }`,
                config: {
                     responseMimeType: "application/json",
                     responseSchema: {
                         type: Type.OBJECT,
                         properties: {
                             name: { type: Type.STRING },
                             calories_per_min: { type: Type.NUMBER }
                         }
                     }
                }
            });
            const data = JSON.parse(response.text || "{}");
            if (data.name) {
                setCustomForm({
                    name: data.name,
                    caloriesPerMin: (data.calories_per_min || 5).toString()
                });
                setShowAi(false);
                setAiInput("");
            }
        } catch (e) {
            console.error(e);
            alert("AI Analysis failed");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSaveCustom = () => {
        if (!customForm.name) return alert("Enter name");
        const newEx: ExerciseItem = {
            id: 'custom-ex-' + Date.now(),
            name: customForm.name,
            caloriesPerUnit: parseFloat(customForm.caloriesPerMin) || 5,
            unit: 'min',
            category: 'Cardio',
            image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=150&q=80'
        };
        addToCart(newEx);
        setIsCustomOpen(false);
        setCustomForm({ name: '', caloriesPerMin: '' });
        setIsCartOpen(true);
    };

    const totalBurn = selectedItems.reduce((acc, i) => acc + (i.caloriesPerUnit * (parseFloat(i.count.toString())||0)), 0);

    return (
        <div className="absolute inset-0 z-50 bg-orange-50/50 flex flex-col animate-in slide-in-from-bottom duration-300">
             {/* Header */}
             <div className="bg-white px-6 pt-12 pb-4 shadow-sm z-10 sticky top-0 shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">Log Workout</h2>
                    <div className="w-8"></div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {["Cardio", "Strength", "Flexibility", "Sports"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat as any)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                                selectedCategory === cat 
                                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-32 bg-white">
                <button 
                    onClick={() => setIsCustomOpen(true)}
                    className="w-full bg-orange-50 border border-orange-200 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 text-orange-600 font-semibold mb-4 hover:bg-orange-100 transition-colors"
                >
                    <Plus size={18} />
                    Create Custom Exercise
                </button>

                {filteredExercises.map(item => {
                    const existing = selectedItems.find(i => i.id === item.id);
                    const count = existing ? existing.count : 0;
                    return (
                        <div key={item.id} className={`flex items-center p-3 rounded-2xl border transition-all ${existing ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-white border-transparent shadow-sm hover:border-slate-100"}`}>
                             <div className="w-14 h-14 rounded-xl overflow-hidden mr-4 shrink-0 bg-slate-100">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">~{item.caloriesPerUnit} kcal/min</p>
                            </div>
                            {existing ? (
                                <div className="flex items-center gap-2 animate-in zoom-in">
                                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">{count} min</span>
                                     <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center active:scale-90"><Plus size={16}/></button>
                                </div>
                            ) : (
                                <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-orange-500 hover:text-white flex items-center justify-center active:scale-90"><Plus size={16}/></button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Custom Modal */}
            {isCustomOpen && (
                <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
                     <div className="px-6 pt-12 pb-4 border-b border-slate-50 flex items-center gap-3">
                         <button onClick={() => setIsCustomOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                             <ChevronLeft size={24} className="text-slate-500"/>
                         </button>
                         <h2 className="text-xl font-bold text-slate-800">Custom Exercise</h2>
                     </div>
                     <div className="flex-1 p-6">
                         {/* AI Toggle */}
                         <div className="mb-6">
                            {!showAi ? (
                                <button onClick={() => setShowAi(true)} className="text-sm font-semibold text-orange-600 flex items-center gap-2 hover:bg-orange-50 px-3 py-2 rounded-lg">
                                    <Sparkles size={16} /> Auto-fill with AI
                                </button>
                            ) : (
                                <div className="bg-orange-50 p-4 rounded-2xl animate-in fade-in">
                                     <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-orange-800 uppercase">AI Magic Fill</label>
                                        <button onClick={() => setShowAi(false)} className="text-orange-400 hover:text-orange-600"><X size={14}/></button>
                                     </div>
                                     <textarea 
                                        value={aiInput}
                                        onChange={(e) => setAiInput(e.target.value)}
                                        placeholder="e.g. 45 mins of Power Yoga"
                                        className="w-full bg-white rounded-xl p-3 text-sm text-orange-900 mb-3 focus:outline-none focus:ring-2 focus:ring-orange-200"
                                        rows={2}
                                     />
                                     <button 
                                        onClick={handleAiAutoFill}
                                        disabled={isAiLoading || !aiInput.trim()}
                                        className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2"
                                     >
                                        {isAiLoading ? <Loader2 className="animate-spin" size={14}/> : <><Sparkles size={14}/> Auto-fill</>}
                                     </button>
                                 </div>
                            )}
                         </div>

                         <div className="space-y-4">
                             <div>
                                 <label className="block text-sm font-medium text-slate-500 mb-1">Exercise Name</label>
                                 <input type="text" value={customForm.name} onChange={e => setCustomForm({...customForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-orange-500"/>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-500 mb-1">Calories per Minute</label>
                                 <input type="number" value={customForm.caloriesPerMin} onChange={e => setCustomForm({...customForm, caloriesPerMin: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-orange-500"/>
                             </div>
                         </div>
                     </div>
                     <div className="p-6 border-t border-slate-50">
                         <button onClick={handleSaveCustom} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 shadow-lg active:scale-[0.98]">Save & Add</button>
                     </div>
                </div>
            )}

            {/* Cart Sheet */}
            {selectedItems.length > 0 && !isCustomOpen && (
                 <>
                    {isCartOpen && <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={() => setIsCartOpen(false)} />}
                    <div className={`absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col ${isCartOpen ? 'h-[60%]' : 'h-24'}`}>
                        <div className="px-6 py-4 flex items-center justify-between cursor-pointer border-b border-slate-50" onClick={() => setIsCartOpen(!isCartOpen)}>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="bg-orange-100 text-orange-600 p-2 rounded-xl"><Timer size={24} /></div>
                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{selectedItems.length}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Est. Burn</p>
                                    <p className="text-lg font-bold text-slate-800 leading-none">{Math.round(totalBurn)} <span className="text-xs font-normal text-slate-400">kcal</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isCartOpen && <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 shadow-md active:scale-95">Log Workout</button>}
                                {isCartOpen ? <ChevronDown size={20} className="text-slate-400"/> : <ChevronUp size={20} className="text-slate-400"/>}
                            </div>
                        </div>
                        <div className={`flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 ${!isCartOpen && 'hidden'}`}>
                            {selectedItems.map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover"/></div>
                                            <div><h4 className="font-bold text-slate-800">{item.name}</h4><p className="text-xs text-slate-400">{item.caloriesPerUnit} kcal/min</p></div>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-rose-400 hover:text-rose-600"><Trash2 size={18}/></button>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2">
                                        <div className="text-sm font-semibold text-orange-600 pl-2">Total: {Math.round(item.caloriesPerUnit * (parseFloat(item.count.toString())||0))} kcal</div>
                                        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-1 py-1">
                                            <button onClick={() => updateDuration(item.id, -5)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md"><Minus size={16}/></button>
                                            <div className="relative">
                                                <input type="text" inputMode="numeric" value={item.count} onChange={e => handleInputChange(item.id, e.target.value)} onBlur={() => handleInputBlur(item.id)} className="w-12 text-center font-bold text-slate-800 focus:outline-none bg-transparent"/>
                                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 pointer-events-none -mr-1">min</span>
                                            </div>
                                            <button onClick={() => updateDuration(item.id, 5)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md"><Plus size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isCartOpen && (
                            <div className="p-6 bg-white border-t border-slate-50 pb-8">
                                <button onClick={handleSave} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 shadow-lg active:scale-[0.98]">Confirm Workout</button>
                            </div>
                        )}
                    </div>
                 </>
            )}
        </div>
    );
};

const App = () => {
  const [stats, setStats] = useState<DailyStats>(INITIAL_STATS);
  // Store all timeline items in one state, but usually good to keep source separate and merge
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [exercises, setExercises] = useState<ActivityItem[]>([]);
  
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false); // For split FAB
  
  const [showProfile, setShowProfile] = useState(false);
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

  // Merge and Sort Timeline
  const timeline: TimelineItem[] = [...meals, ...exercises].sort((a, b) => {
      // Simple sort by time string (assuming same day)
      // For a real app, use full Date objects
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
                            <h1 className="text-2xl font-bold">Hello, Alex</h1>
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
                  <StatsView meals={meals} exercises={exercises} />
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
        {showProfile && <ProfileView onClose={() => setShowProfile(false)} stats={stats} />}

      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);