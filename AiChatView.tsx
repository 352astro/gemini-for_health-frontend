
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChevronLeft, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { UserProfile, DailyStats } from "./types";

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

interface AiChatViewProps {
    onClose: () => void;
    userProfile: UserProfile;
    currentStats: DailyStats;
    initialContext?: string; // The tip that was shown on the dashboard
}

export const AiChatView: React.FC<AiChatViewProps> = ({ onClose, userProfile, currentStats, initialContext }) => {
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: 'init', 
            role: 'model', 
            text: `Hi ${userProfile.name.split(' ')[0]}! I'm your personal nutrition assistant. I see you've consumed ${Math.round(currentStats.calories.current)} calories today. How can I help you reach your goals?` 
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Build conversation history for context
            // Note: In a real app, you'd use chat.sendMessage with history, 
            // but for this stateless demo we'll construct a prompt.
            const systemPrompt = `
                You are a friendly, encouraging, and knowledgeable nutritionist AI.
                User Profile: ${userProfile.age} years old, ${userProfile.height}cm, ${userProfile.gender}.
                Current Daily Stats: 
                - Calories: ${currentStats.calories.current} / ${currentStats.calories.target}
                - Protein: ${currentStats.protein.current}g
                - Carbs: ${currentStats.carbs.current}g
                - Fat: ${currentStats.fat.current}g
                
                Keep answers concise (under 80 words if possible) unless asked for a detailed plan. 
                Be empathetic and scientific.
            `;

            const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${m.text}`).join('\n');
            const fullPrompt = `${systemPrompt}\n\n${chatHistory}\nUser: ${userMsg.text}\nModel:`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fullPrompt,
            });

            const text = response.text || "I'm having trouble connecting right now. Please try again.";
            
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-4 shadow-sm z-10 sticky top-0 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            AI Nutritionist <Sparkles size={14} className="text-indigo-500" />
                        </h2>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {/* Context Context Bubble (The tip that started it) */}
                {initialContext && (
                    <div className="flex justify-center mb-6">
                        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full text-xs font-medium text-indigo-600 text-center max-w-[85%] shadow-sm">
                            Talking about: "{initialContext}"
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                            msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white text-indigo-600'
                        }`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                        </div>
                        
                        <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-slate-800 text-white rounded-tr-none' 
                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                             <Bot size={18} />
                        </div>
                        <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-50">
                <div className="relative flex items-center bg-slate-100 rounded-2xl p-1 pr-1.5 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white focus-within:shadow-sm">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your diet..."
                        className="flex-1 bg-transparent px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none text-sm font-medium"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`p-2.5 rounded-xl transition-all ${
                            input.trim() 
                            ? 'bg-indigo-600 text-white shadow-md active:scale-95' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
