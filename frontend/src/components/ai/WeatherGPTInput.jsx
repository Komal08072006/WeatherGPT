import React, { useState } from 'react';
import { Sparkles, Mic, Send, Zap, Bot } from 'lucide-react';
import { mockSuggestedPrompts } from '../../data/mockData';

export default function WeatherGPTInput({ onAsk, isLoading }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onAsk(query);
  };

  const handleSelectPrompt = (promptText) => {
    setQuery(promptText);
    onAsk(promptText);
  };

  return (
    <div className="mb-4">
      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested Prompts:
        </span>
        {mockSuggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPrompt(prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/50 text-xs font-medium text-slate-700 transition-all shrink-0 shadow-2xs"
          >
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-sm focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 transition-all p-1.5">
          <div className="p-2 text-slate-400 pl-3">
            <Bot className="w-5 h-5 text-sky-500" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about the weather in English or Indian languages (हिंदी, বাংলা, தமிழ்...)..."
            className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none px-2 py-2"
          />

          <div className="flex items-center gap-1 pr-1 shrink-0">
            <button
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white/20" />
              <span>{isLoading ? 'Processing...' : 'Ask AI'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
