
import React, { useState } from 'react';
import { ChevronLeft, Camera } from "lucide-react";
import { UserProfile } from "./types";

const EditProfileScreen: React.FC<{
    profile: UserProfile;
    onClose: () => void;
    onSave: (newProfile: UserProfile) => void;
}> = ({ profile, onClose, onSave }) => {
    const [formData, setFormData] = useState<UserProfile>(profile);

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-300">
             {/* Header */}
             <div className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-slate-50">
                 <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-500">
                     <ChevronLeft size={24} />
                 </button>
                 <h2 className="text-lg font-bold text-slate-800">Edit Profile</h2>
                 <div className="w-10"></div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* Avatar Area */}
                 <div className="flex flex-col items-center mb-6">
                     <div className="w-24 h-24 rounded-full bg-slate-100 mb-3 relative overflow-hidden group">
                         <img 
                            src="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" 
                            alt="Profile" 
                            className="w-full h-full"
                         />
                         <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                             <Camera className="text-white" size={24} />
                         </div>
                     </div>
                     <p className="text-xs text-slate-400">Tap to change avatar</p>
                 </div>

                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                         <input 
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                         />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">Age</label>
                             <input 
                                type="number" 
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">Height (cm)</label>
                             <input 
                                type="number" 
                                value={formData.height}
                                onChange={(e) => setFormData({...formData, height: parseInt(e.target.value) || 0})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
                             />
                         </div>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                        <div className="flex gap-3">
                            {(['Male', 'Female'] as const).map(g => (
                                <button
                                    key={g}
                                    onClick={() => setFormData({...formData, gender: g})}
                                    className={`flex-1 py-3 rounded-2xl font-semibold border transition-all ${
                                        formData.gender === g 
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                     </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Activity Level</label>
                         <select 
                            value={formData.activityLevel}
                            onChange={(e) => setFormData({...formData, activityLevel: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 appearance-none"
                         >
                             <option>Sedentary</option>
                             <option>Lightly Active</option>
                             <option>Moderate</option>
                             <option>Very Active</option>
                         </select>
                     </div>
                 </div>
             </div>

             <div className="p-6 border-t border-slate-50 bg-white">
                 <button 
                    onClick={handleSave}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-xl active:scale-[0.98] transition-all"
                 >
                     Save Changes
                 </button>
             </div>
        </div>
    );
};

export default EditProfileScreen;
