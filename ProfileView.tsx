
import React from 'react';
import { ChevronLeft, Edit2, Weight, Ruler, Scale, Plus, Target, Flame, Activity, Settings, ChevronRight, TrendingUp } from "lucide-react";
import { UserProfile, DailyStats } from "./types";

const ProfileView: React.FC<{ 
    onClose: () => void; 
    stats: DailyStats; 
    weight: number; 
    profile: UserProfile;
    onOpenWeight: () => void; 
    onEditProfile: () => void;
}> = ({ onClose, stats, weight, profile, onOpenWeight, onEditProfile }) => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Profile Header (Clickable for Edit) */}
        <div 
            onClick={onEditProfile}
            className="bg-emerald-600 pb-8 pt-12 rounded-b-[3rem] shadow-xl relative overflow-hidden shrink-0 cursor-pointer group active:scale-[0.99] transition-transform"
        >
           {/* Decorative blobs */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-400 rounded-full blur-2xl opacity-30 translate-y-1/2 -translate-x-1/4"></div>
           
           {/* Edit Hint Icon */}
           <div className="absolute top-12 right-6 p-2 bg-white/10 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
               <Edit2 size={16} className="text-white" />
           </div>

           <div className="relative z-10 px-6">
               <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
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
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {profile.name}
                 </h2>
                 <p className="text-emerald-100 font-medium">Keep Fit Program</p>
               </div>

               {/* Bio Stats */}
               <div className="flex justify-between mt-8 px-2 max-w-xs mx-auto">
                  <div className="text-center p-2">
                     <span className="text-2xl font-bold text-white block">
                        {weight} 
                     </span>
                     <span className="text-xs text-emerald-200 uppercase tracking-wide flex items-center justify-center gap-1">
                        <Weight size={10} /> kg
                     </span>
                  </div>
                  <div className="w-px bg-emerald-500/50 my-2"></div>
                  <div className="text-center p-2">
                     <span className="text-2xl font-bold text-white block">{profile.height}</span>
                     <span className="text-xs text-emerald-200 uppercase tracking-wide flex items-center justify-center gap-1">
                        <Ruler size={10} /> cm
                     </span>
                  </div>
                  <div className="w-px bg-emerald-500/50 my-2"></div>
                  <div className="text-center p-2">
                     <span className="text-2xl font-bold text-white block">{profile.age}</span>
                     <span className="text-xs text-emerald-200 uppercase tracking-wide">Years</span>
                  </div>
               </div>
           </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Weight Tracker Button Bar (Updated) */}
            <button 
                onClick={onOpenWeight}
                className="w-full bg-white p-4 rounded-3xl shadow-sm border border-emerald-100 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 relative">
                        <TrendingUp size={20} className="absolute" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-slate-800">Weight Tracker</h3>
                        <p className="text-slate-400 text-xs">History & Progress</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-colors">
                    <ChevronRight size={20} />
                </div>
            </button>

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

export default ProfileView;
