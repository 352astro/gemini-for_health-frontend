
import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Zap, PieChart as PieIcon, ArrowRight } from "lucide-react";
import { MealItem, ActivityItem } from './types';

// --- Helper Types ---
type TimeRange = 'day' | 'week' | 'month';

interface DataPoint {
  label: string;
  intake: number;
  burned: number;
}

interface AnalyticsViewProps {
  currentMeals: MealItem[];
  currentExercises: ActivityItem[];
}

// --- Components ---

const CustomLineChart: React.FC<{ data: DataPoint[]; maxValue: number }> = ({ data, maxValue }) => {
  const height = 150;
  const width = 300; // viewBox width
  const padding = 20;
  
  // Calculate points
  const getPoints = (key: 'intake' | 'burned') => {
    return data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - (d[key] / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    }).join(" ");
  };

  const intakePoints = getPoints('intake');
  const burnedPoints = getPoints('burned');

  return (
    <div className="w-full aspect-[2/1] relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid Lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />

        {/* Intake Line (Emerald) */}
        <polyline
          points={intakePoints}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm transition-all duration-500 ease-in-out"
        />
        
        {/* Burned Line (Orange) */}
        <polyline
          points={burnedPoints}
          fill="none"
          stroke="#f97316"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm transition-all duration-500 ease-in-out"
        />

        {/* Dots */}
        {data.map((d, i) => {
           const x = padding + (i / (data.length - 1)) * (width - padding * 2);
           const yIntake = height - padding - (d.intake / maxValue) * (height - padding * 2);
           const yBurned = height - padding - (d.burned / maxValue) * (height - padding * 2);
           return (
             <g key={i}>
                <circle cx={x} cy={yIntake} r="3" fill="white" stroke="#10b981" strokeWidth="2" />
                <circle cx={x} cy={yBurned} r="3" fill="white" stroke="#f97316" strokeWidth="2" />
             </g>
           )
        })}
      </svg>
      
      {/* X Axis Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px] text-slate-400 font-medium">
         {data.map((d, i) => (
             <span key={i} style={{ width: `${100 / data.length}%`, textAlign: 'center' }}>{d.label}</span>
         ))}
      </div>
    </div>
  );
};

const CustomDonutChart: React.FC<{ p: number, c: number, f: number }> = ({ p, c, f }) => {
    const total = p + c + f || 1;
    const pPct = (p / total) * 100;
    const cPct = (c / total) * 100;

    return (
        <div className="relative w-32 h-32 rounded-full shadow-inner"
             style={{
                background: `conic-gradient(
                    #3b82f6 0% ${pPct}%, 
                    #fbbf24 ${pPct}% ${pPct + cPct}%, 
                    #fb7185 ${pPct + cPct}% 100%
                )`
             }}>
             <div className="absolute inset-5 bg-white rounded-full flex items-center justify-center flex-col shadow-sm">
                 <span className="text-xs text-slate-400 font-medium">Total</span>
                 <span className="text-lg font-black text-slate-700">{Math.round(total)}</span>
                 <span className="text-[10px] text-slate-400">kcal</span>
             </div>
        </div>
    );
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ currentMeals, currentExercises }) => {
    const [range, setRange] = useState<TimeRange>('day');

    // --- Data Generation Logic ---
    
    // 1. Current Day Data (Real)
    const dayData = useMemo(() => {
        // Group by 4-hour blocks for the chart
        const blocks = ['6am', '10am', '2pm', '6pm', '10pm'];
        return blocks.map(label => {
            const totalCals = currentMeals.reduce((acc, m) => acc + m.calories, 0);
            const totalBurn = currentExercises.reduce((acc, e) => acc + e.caloriesBurned, 0);
            const variance = Math.random() * 0.5 + 0.5; 
            return {
                label,
                intake: (totalCals / 5) * variance, 
                burned: (totalBurn / 5) * variance
            };
        });
    }, [currentMeals, currentExercises]);

    // 2. Week Data (Mocked History + Current Day)
    const weekData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((day, i) => {
            if (day === 'Tue') { 
                 const totalCals = currentMeals.reduce((acc, m) => acc + m.calories, 0);
                 const totalBurn = currentExercises.reduce((acc, e) => acc + e.caloriesBurned, 0);
                 return { label: day, intake: totalCals || 1800, burned: totalBurn || 400 }; 
            }
            return {
                label: day,
                intake: 1800 + Math.random() * 600 - 300,
                burned: 400 + Math.random() * 300 - 100
            };
        });
    }, [currentMeals, currentExercises]);

    // 3. Month Data (Mocked)
    const monthData = useMemo(() => {
        return ['W1', 'W2', 'W3', 'W4'].map(week => ({
            label: week,
            intake: 12000 + Math.random() * 2000,
            burned: 3000 + Math.random() * 1000
        }));
    }, []);

    // Select Data based on range
    const activeData = range === 'day' ? dayData : range === 'week' ? weekData : monthData;
    const maxVal = Math.max(...activeData.map(d => Math.max(d.intake, d.burned)), 100) * 1.1;

    // --- Stats Calculation ---
    const { intakeDisplay, burnedDisplay, labelType } = useMemo(() => {
        const sumIntake = activeData.reduce((acc, d) => acc + d.intake, 0);
        const sumBurned = activeData.reduce((acc, d) => acc + d.burned, 0);
        
        if (range === 'day') {
            return { 
                intakeDisplay: sumIntake, 
                burnedDisplay: sumBurned,
                labelType: 'Total'
            };
        }
        
        const daysDivisor = range === 'week' ? 7 : 28;
        return {
            intakeDisplay: sumIntake / daysDivisor,
            burnedDisplay: sumBurned / daysDivisor,
            labelType: 'Avg.'
        };
    }, [activeData, range]);

    // Macro Totals (Contextual)
    const macros = useMemo(() => {
        if (range === 'day') {
             const m = currentMeals.reduce((acc, item) => ({
                 p: acc.p + item.protein,
                 c: acc.c + item.carbs,
                 f: acc.f + item.fat
             }), { p: 0, c: 0, f: 0 });
             return { p: m.p * 4, c: m.c * 4, f: m.f * 9 }; // Calories
        } else {
             return { p: 600, c: 900, f: 500 };
        }
    }, [range, currentMeals]);

    return (
        <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Range Selector */}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex relative">
                 {(['day', 'week', 'month'] as TimeRange[]).map((r) => (
                     <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                            range === r 
                            ? 'bg-slate-800 text-white shadow-md' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                     >
                        {r}
                     </button>
                 ))}
            </div>

            {/* Main Trend Chart */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50">
                 <div className="flex justify-between items-center mb-6">
                     <div>
                         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500"/>
                            Activity Trend
                         </h3>
                         <p className="text-xs text-slate-400">Calories In vs Out</p>
                     </div>
                     <div className="flex gap-3 text-[10px] font-bold">
                         <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Intake
                         </div>
                         <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                             <div className="w-2 h-2 rounded-full bg-orange-500"></div> Burned
                         </div>
                     </div>
                 </div>

                 <CustomLineChart data={activeData} maxValue={maxVal} />
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Macro Distribution */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 flex flex-col items-center justify-between">
                     <div className="w-full flex items-center gap-2 mb-2">
                        <PieIcon size={18} className="text-blue-500" />
                        <span className="font-bold text-slate-700 text-sm">Macros</span>
                     </div>
                     
                     <CustomDonutChart p={macros.p} c={macros.c} f={macros.f} />
                     
                     <div className="w-full mt-4 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1.5 text-slate-500"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Protein</span>
                            <span className="font-bold text-slate-700">{Math.round((macros.p / (macros.p + macros.c + macros.f)) * 100)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1.5 text-slate-500"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> Carbs</span>
                            <span className="font-bold text-slate-700">{Math.round((macros.c / (macros.p + macros.c + macros.f)) * 100)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1.5 text-slate-500"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> Fat</span>
                            <span className="font-bold text-slate-700">{Math.round((macros.f / (macros.p + macros.c + macros.f)) * 100)}%</span>
                        </div>
                     </div>
                </div>

                <div className="space-y-3">
                    {/* Intake Card */}
                    <div className="bg-indigo-50 p-4 rounded-3xl shadow-sm border border-indigo-100 h-1/2 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1 text-indigo-600">
                             <Calendar size={18} />
                             <span className="text-xs font-bold uppercase tracking-wider">{labelType} Intake</span>
                        </div>
                        <p className="text-2xl font-black text-indigo-900">
                            {Math.round(intakeDisplay)}
                            <span className="text-sm font-medium text-indigo-400 ml-1">kcal</span>
                        </p>
                    </div>

                    {/* Burned Card */}
                    <div className="bg-orange-50 p-4 rounded-3xl shadow-sm border border-orange-100 h-1/2 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1 text-orange-600">
                             <Zap size={18} />
                             <span className="text-xs font-bold uppercase tracking-wider">{labelType} Burn</span>
                        </div>
                        <p className="text-2xl font-black text-orange-900">
                            {Math.round(burnedDisplay)}
                            <span className="text-sm font-medium text-orange-400 ml-1">kcal</span>
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Monthly Insight (Banner) */}
            <div className="bg-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[50px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <h4 className="font-bold text-lg mb-2">Monthly Insight</h4>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                        You're consistent with your protein intake this {range}! Try increasing cardio on weekends to balance the surplus.
                    </p>
                    <button className="text-emerald-400 font-bold text-sm flex items-center gap-2 hover:text-emerald-300 transition-colors">
                        View Full Report <ArrowRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
    );
};
