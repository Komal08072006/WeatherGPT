import React, { useState } from 'react';
import { Sprout, CheckCircle2, AlertCircle, ArrowRight, Languages } from 'lucide-react';

export default function FarmerAdvisory({ advisoryData, onViewDetailed }) {
  const [language, setLanguage] = useState('en');

  if (!advisoryData) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                AI Farmer Advisory
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {advisoryData.zone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md hidden sm:inline-block">
              {advisoryData.modelBadge}
            </span>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-200/60 transition-colors"
            >
              <Languages className="w-3 h-3 text-slate-500" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Highlighted Warning Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 mb-4 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Agro-Precipitation Warning: </span>
            {advisoryData.primaryAlert}
          </div>
        </div>

        {/* Detailed Recommendation Cards */}
        <div className="space-y-2.5">
          {advisoryData.recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:border-slate-300 transition-all text-xs"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 leading-snug">
                    {rec.title}
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    {rec.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px] text-slate-400">ICAR-CRIDA Guidelines Aligned</span>
        <button
          onClick={onViewDetailed}
          className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:translate-x-0.5 transition-transform"
        >
          <span>View Detailed Krishi Advisory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
