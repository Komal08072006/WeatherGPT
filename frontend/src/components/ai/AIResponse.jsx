import React, { useState } from 'react';
import { Sparkles, ThumbsUp, Share2, Check, ShieldCheck, Tractor, Truck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function AIResponse({ responseData, currentQuery }) {
  const { formatNumber } = useLanguage();
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!responseData) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(responseData.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-sky-200/90 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Response Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span className="font-bold text-slate-800">
            Answer Preview: <span className="text-slate-600 font-normal">"{currentQuery || responseData.question}"</span>
          </span>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          Generated in {formatNumber(responseData.generatedTime)}
        </span>
      </div>

      {/* Main Answer Body */}
      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium mb-4 bg-slate-50/60 p-3 rounded-xl border border-slate-200/50">
        {formatNumber(responseData.answer)}
      </div>

      {/* Two Column Impact Cards: Agro & Urban Logistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Agricultural Impact */}
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
            <Tractor className="w-4 h-4 text-emerald-600" />
            <span>Agricultural Impact</span>
          </div>
          <p className="text-emerald-950/80 text-[11px] leading-relaxed">
            {formatNumber(responseData.agriculturalImpact)}
          </p>
        </div>

        {/* Urban Logistics */}
        <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Urban Logistics</span>
          </div>
          <p className="text-blue-950/80 text-[11px] leading-relaxed">
            {formatNumber(responseData.urbanLogistics)}
          </p>
        </div>
      </div>

      {/* Footer Badges & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-slate-100">
        {/* Data Source Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="text-slate-400 font-semibold uppercase tracking-wider mr-1">
            Data Sources:
          </span>
          {responseData.dataSources.map((source, idx) => (
            <span
              key={idx}
              className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md border border-slate-200"
            >
              {source}
            </span>
          ))}
        </div>

        {/* Helpful & Share Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
              liked
                ? 'bg-sky-100 text-sky-700 border-sky-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{liked ? 'Helpful!' : 'Helpful'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
