
import React from 'react';
import { Flame, Activity, PieChart, Leaf, Dumbbell } from "lucide-react";
import { MealItem, ActivityItem } from "./types";

export const ProgressBar: React.FC<{ current: number; target: number; colorClass: string }> = ({ current, target, colorClass }) => {
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

export const RingProgress: React.FC<{ current: number; target: number; children: React.ReactNode }> = ({ current, target, children }) => {
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

export const MealCard: React.FC<{ meal: MealItem }> = ({ meal }) => (
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

export const ActivityCard: React.FC<{ activity: ActivityItem }> = ({ activity }) => (
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
