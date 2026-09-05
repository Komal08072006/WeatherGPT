import React, { useState, useEffect } from 'react';
import { Sprout, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export default function FarmerAdvisory({ advisoryData, currentLocation, selectedLanguage, onViewDetailed }) {
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

    try {
      let url = '';
      if (currentLocation && typeof currentLocation === 'object' && currentLocation.latitude != null && currentLocation.longitude != null) {
        url = `http://localhost:8000/farmer-advisory?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&language=${encodeURIComponent(lang)}`;
      } else {
        const cleanName = getCleanLocationName(currentLocation);
        url = `http://localhost:8000/farmer-advisory?location=${encodeURIComponent(cleanName)}&language=${encodeURIComponent(lang)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to fetch farmer advisory');
      }

      const data = await response.json();
      setAdvisory(data);
    } catch (err) {
      setError(err.message || 'Failed to generate farmer advisory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisory();
  }, [currentLocation, selectedLanguage]);

  const displayLocation = advisory?.location || currentLocation?.name || getCleanLocationName(currentLocation);
  const sourceBadge = advisory?.source || 'Open-Meteo + AI Analysis';
  const recommendations = advisory?.recommendations || [];

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
                {displayLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md hidden sm:inline-block">
              {sourceBadge}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            <span className="text-xs font-medium">Generating agricultural advisory...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between my-2">
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
              <div className="text-xs text-slate-500 text-center py-4">
                No recommendations available.
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:border-slate-300 transition-all text-xs"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800 leading-snug">
                        {rec.title}
                      </h4>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
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
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="text-[11px] text-slate-400">
          AI-generated advisory based on live weather data — not a substitute for official agricultural guidance
        </span>
        {onViewDetailed && (
          <button
            onClick={onViewDetailed}
            className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:translate-x-0.5 transition-transform shrink-0"
          >
            <span>View Detailed Krishi Advisory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
