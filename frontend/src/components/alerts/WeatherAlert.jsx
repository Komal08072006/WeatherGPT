import React from 'react';
import { TriangleAlert, Clock, MapPin, Share2, FileText } from 'lucide-react';

export default function WeatherAlert({ alertData, onShare, onViewAdvisory }) {
  if (!alertData) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/30 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 relative overflow-hidden">
      {/* Top Warning Title & Badge */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-amber-200/60 dark:border-amber-800/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300">
            <TriangleAlert className="w-4 h-4 fill-amber-600/20" />
          </div>
          <h3 className="text-base font-bold text-amber-950 dark:text-amber-100 tracking-tight">
            {alertData.title}
          </h3>
        </div>

        <span className="text-[10px] font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full shadow-2xs">
          {alertData.badge}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40 text-xs">
        <div>
          <span className="text-[10px] font-bold text-amber-800/60 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
            EXPECTED WINDOW
          </span>
          <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-100">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{alertData.expectedWindow}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-amber-800/60 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
            AFFECTED TRACT
          </span>
          <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-100">
            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{alertData.affectedTract}</span>
          </div>
        </div>
      </div>

      {/* Meteorological Diagnostic */}
      <div className="mb-4">
        <span className="text-[10px] font-bold text-amber-900/70 dark:text-amber-300 uppercase tracking-wider block mb-1">
          Meteorological Diagnostic
        </span>
        <p className="text-xs text-amber-950/90 dark:text-amber-200 leading-relaxed italic bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-lg border border-amber-200/40 dark:border-amber-900/30">
          "{alertData.diagnostic}"
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 text-xs">
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Alert</span>
        </button>

        <button
          onClick={onViewAdvisory}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Full Advisory</span>
        </button>
      </div>
    </div>
  );
}
