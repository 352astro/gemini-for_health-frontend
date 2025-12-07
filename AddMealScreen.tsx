
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { X, Search, PenTool, Plus, Sparkles, Loader2, ChevronLeft, ShoppingBag, ChevronDown, ChevronUp, Trash2, Minus } from "lucide-react";
import { MealItem, FoodItem, DailyStats } from "./types";
import { FOOD_DB } from "./MockData";

interface SelectedFoodItem extends FoodItem {
    count: number | string; 
    mode: 'unit' | 'gram';
}

interface CustomFoodForm {
  name: string;
  unitName: string;
  weightPerUnit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
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

export default AddMealScreen;
