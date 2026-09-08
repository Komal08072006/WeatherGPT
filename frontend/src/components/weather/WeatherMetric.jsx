import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function WeatherMetric({ label, value, status, subText, icon: Icon, valueColor }) {
  const { formatNumber } = useLanguage();
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 stroke-[2]" />}
      </div>

      <div className="flex items-baseline gap-1.5 my-0.5">
        <span className={`text-base sm:text-lg font-bold ${valueColor || 'text-slate-800 dark:text-slate-100'}`}>
          {formatNumber(value)}
        </span>
        {status && (
          <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
            {status}
          </span>
        )}
      </div>

      {subText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate mt-0.5">
          {subText}
        </p>
      )}
    </div>
  );
}
