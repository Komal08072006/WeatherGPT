import React, { useState, useEffect } from 'react';
import { Sprout, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerAdvisory({ advisoryData, currentLocation, onViewDetailed }) {
  const { selectedLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [advisory, setAdvisory] = useState(null);

  const lang = selectedLanguage || 'English';

  const getCleanLocationName = (loc) => {
    if (!loc) return 'Lucknow';
    if (typeof loc === 'string') return loc.split(',')[0].trim();
    if (loc.searchName) return loc.searchName;
    if (loc.name) return loc.name.split(',')[0].trim();
    return 'Lucknow';
  };

  const fetchAdvisory = async () => {
    setLoading(true);
    setError(null);

    const maxAutoRetries = 2;
    const retryDelay = 1500;
    let lastErrorMsg = '';

    for (let attempt = 0; attempt <= maxAutoRetries; attempt++) {
      try {
        let url = '';
        if (currentLocation && typeof currentLocation === 'object' && currentLocation.latitude != null && currentLocation.longitude != null) {
          url = `${API_BASE_URL}/farmer-advisory?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&language=${encodeURIComponent(lang)}`;
        } else {
          const cleanName = getCleanLocationName(currentLocation);
          url = `${API_BASE_URL}/farmer-advisory?location=${encodeURIComponent(cleanName)}&language=${encodeURIComponent(lang)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to fetch farmer advisory');
        }

        const data = await response.json();
        setAdvisory(data);
        setError(null);
        setLoading(false);
        return;
      } catch (err) {
        lastErrorMsg = err.message || 'Failed to generate farmer advisory';
        console.warn(`[FarmerAdvisory] Attempt ${attempt + 1} failed:`, lastErrorMsg);
        if (attempt < maxAutoRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    setError(lastErrorMsg);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvisory();
  }, [currentLocation, selectedLanguage]);

  const displayLocation = advisory?.location || currentLocation?.name || getCleanLocationName(currentLocation);
  const sourceBadge = advisory?.source || 'Open-Meteo + AI Analysis';
  const recommendations = advisory?.recommendations || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                AI Farmer Advisory
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {displayLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 px-2 py-0.5 rounded-md hidden sm:inline-block">
              {sourceBadge}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <span className="text-xs font-medium">Generating agricultural advisory...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between my-2">
            <span>{error}</span>
            <button
              onClick={fetchAdvisory}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Recommendations List */}
        {!loading && !error && (
          <div className="space-y-2.5">
            {recommendations.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                No recommendations available.
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-xs"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-snug">
                        {rec.title}
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                        {rec.advice}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px] text-slate-400 dark:text-slate-400">
          AI-generated advisory based on live weather data — not a substitute for official agricultural guidance
        </span>
        {onViewDetailed && (
          <button
            onClick={onViewDetailed}
            className="font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 hover:translate-x-0.5 transition-transform shrink-0"
          >
            <span>View Detailed Krishi Advisory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
