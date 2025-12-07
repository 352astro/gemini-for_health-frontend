
import React, { useState, useMemo } from 'react';
import { ChevronLeft, Info, Check, Ruler, History, TrendingUp, Calendar, Plus } from "lucide-react";
import { WeightRecord } from './types';

interface WeightTrackerViewProps {
    currentWeight: number;
    height: number; // in cm
    history: WeightRecord[];
    onClose: () => void;
    onSave: (weight: number) => void;
}

// --- Helper: Simple Line Chart for Weight ---
const WeightChart: React.FC<{ data: WeightRecord[] }> = ({ data }) => {
    if (data.length < 2) return (
        <div className="h-40 flex items-center justify-center text-slate-300 text-xs italic border-t border-slate-50 bg-slate-50/50 rounded-2xl">
            Not enough data for trend
        </div>
    );

    const weights = data.map(d => d.weight);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const height = 150;
    const width = 300;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.weight - minW) / (maxW - minW)) * height;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="w-full h-40 relative mt-4 animate-in fade-in duration-700">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Grid */}
                <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" strokeWidth="1" />
                <line x1="0" y1="0" x2={width} y2="0" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                
                {/* Gradient Fill */}
                <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path 
                    d={`M0,${height} ${points} L${width},${height} Z`} 
                    fill="url(#weightGradient)" 
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {data.map((d, i) => {
                     const x = (i / (data.length - 1)) * width;
                     const y = height - ((d.weight - minW) / (maxW - minW)) * height;
                     return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" className="fill-white stroke-emerald-500 stroke-[3px]" />
                        </g>
                     )
                })}
            </svg>
            <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                <span>{data[0].date}</span>
                <span>Today</span>
            </div>
        </div>
    );
};

export const WeightTrackerView: React.FC<WeightTrackerViewProps> = ({ 
    currentWeight, 
    height, 
    history,
    onClose, 
    onSave 
}) => {
    // Tabs: 'overview' (History) or 'log' (Add)
    const [activeTab, setActiveTab] = useState<'overview' | 'log'>('overview');
    const [weightInput, setWeightInput] = useState(currentWeight);

    // Calculate BMI
    const calculateBMI = (w: number) => {
        const hM = height / 100;
        return (w / (hM * hM)).toFixed(1);
    };

    const bmi = useMemo(() => calculateBMI(activeTab === 'overview' ? currentWeight : weightInput), [activeTab, currentWeight, weightInput, height]);

    const bmiCategory = useMemo(() => {
        const val = parseFloat(bmi);
        if (val < 18.5) return { label: 'Underweight', color: 'text-blue-500', bg: 'bg-blue-50' };
        if (val < 25) return { label: 'Healthy Weight', color: 'text-emerald-500', bg: 'bg-emerald-50' };
        if (val < 30) return { label: 'Overweight', color: 'text-orange-500', bg: 'bg-orange-50' };
        return { label: 'Obese', color: 'text-rose-500', bg: 'bg-rose-50' };
    }, [bmi]);

    // Trend Calc
    const weightChange = history.length > 0 ? (currentWeight - history[0].weight).toFixed(1) : 0;
    const isGain = parseFloat(weightChange.toString()) > 0;

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 pt-12 pb-2 flex items-center justify-between">
                <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'overview' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                        }`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('log')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'log' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                        }`}
                    >
                        Log Weight
                    </button>
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="flex-1 flex flex-col px-6 pt-6 overflow-y-auto">
                
                {activeTab === 'overview' ? (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl shadow-slate-200">
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Current Weight</p>
                                     <div className="flex items-baseline gap-1">
                                         <span className="text-4xl font-black">{currentWeight}</span>
                                         <span className="text-lg font-medium text-slate-400">kg</span>
                                     </div>
                                 </div>
                                 <div className={`px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md flex items-center gap-1.5 ${isGain ? 'text-rose-300' : 'text-emerald-300'}`}>
                                     <TrendingUp size={14} className={!isGain ? 'rotate-180' : ''}/>
                                     <span className="text-xs font-bold">{Math.abs(parseFloat(weightChange as string))} kg</span>
                                 </div>
                             </div>
                             <div className="h-px bg-white/10 w-full mb-4"></div>
                             <div className="flex gap-8">
                                 <div>
                                     <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Start</p>
                                     <p className="font-bold">{history[0]?.weight || currentWeight} kg</p>
                                 </div>
                                 <div>
                                     <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Goal</p>
                                     <p className="font-bold">68.0 kg</p>
                                 </div>
                                 <div>
                                     <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">BMI</p>
                                     <p className={`font-bold ${bmiCategory.color.replace('text-', 'text-')}`}>{bmi}</p>
                                 </div>
                             </div>
                        </div>

                        {/* Chart Section */}
                        <div>
                             <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2 px-2">
                                <History size={16} className="text-emerald-500"/>
                                Weight History
                             </h3>
                             <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
                                <WeightChart data={history} />
                             </div>
                        </div>

                        {/* BMI Stats (Visual) */}
                        <div className={`p-5 rounded-3xl ${bmiCategory.bg} flex items-center justify-between`}>
                            <div>
                                <p className={`text-xs font-bold uppercase opacity-70 ${bmiCategory.color}`}>BMI Status</p>
                                <p className={`text-2xl font-black ${bmiCategory.color}`}>{bmiCategory.label}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-[10px] font-medium opacity-60 ${bmiCategory.color}`}>Based on {height}cm height</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                        {/* Log Mode */}
                        <div className="text-center mb-12 mt-4">
                            <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                                New Entry
                            </h2>
                            <div className="relative inline-flex items-baseline justify-center gap-2">
                                <span className="text-7xl font-black text-slate-800 tracking-tighter">
                                    {weightInput.toFixed(1)}
                                </span>
                                <span className="text-xl font-medium text-slate-400">kg</span>
                            </div>
                        </div>

                        {/* The "Scale" Slider */}
                        <div className="mb-12">
                            <input 
                                type="range" 
                                min={30} 
                                max={150} 
                                step={0.1}
                                value={weightInput}
                                onChange={(e) => setWeightInput(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <div className="flex justify-between mt-6">
                                <button 
                                    onClick={() => setWeightInput(prev => parseFloat((prev - 0.1).toFixed(1)))}
                                    className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 active:scale-95 transition-all text-xl"
                                >
                                    -
                                </button>
                                <div className="text-xs text-slate-300 font-medium flex items-center gap-1">
                                    <Ruler size={14}/> Slide to adjust
                                </div>
                                <button 
                                    onClick={() => setWeightInput(prev => parseFloat((prev + 0.1).toFixed(1)))}
                                    className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 active:scale-95 transition-all text-xl"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl mb-auto">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Date</span>
                                <span className="font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar size={14} className="text-emerald-500"/>
                                    Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action Button (Conditional) */}
            <div className="p-6 pb-10 bg-white border-t border-slate-50">
                {activeTab === 'overview' ? (
                     <button 
                        onClick={() => setActiveTab('log')}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Log New Weight
                    </button>
                ) : (
                    <button 
                        onClick={() => onSave(weightInput)}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                        Confirm Weight
                    </button>
                )}
            </div>
        </div>
    );
};
