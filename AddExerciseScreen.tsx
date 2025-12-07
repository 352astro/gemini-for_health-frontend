
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { X, Search, PenTool, Plus, Sparkles, Loader2, ChevronLeft, Timer, ChevronDown, ChevronUp, Trash2, Minus } from "lucide-react";
import { ActivityItem, ExerciseItem } from "./types";
import { EXERCISE_DB } from "./MockData";

interface SelectedExerciseItem extends ExerciseItem {
    count: number | string; // Duration in minutes usually
}

interface CustomExerciseForm {
  name: string;
  caloriesPerMin: string;
}

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

export default AddExerciseScreen;
