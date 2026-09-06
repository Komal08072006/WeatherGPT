import React, { useState, useEffect } from 'react';
import ClimateInsight from '../components/climate/ClimateInsight';
import { TrendingUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ClimateAnalysisPage({ currentLocation }) {
  const [climateData, setClimateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchLocation = currentLocation?.searchName || (currentLocation?.name ? currentLocation.name.split(',')[0].trim() : 'Lucknow');

  const fetchClimateAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = '';
      if (currentLocation?.latitude != null && currentLocation?.longitude != null) {
        url = `http://localhost:8000/climate-analysis?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}`;
      } else {
        url = `http://localhost:8000/climate-analysis?location=${encodeURIComponent(searchLocation)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to fetch historical climate data');
      }

      const data = await res.json();
      setClimateData(data);
    } catch (err) {
      console.error('Error fetching climate analysis:', err);
      setError(err.message || 'Unable to fetch historical climate data from Open-Meteo Archive');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClimateAnalysis();
  }, [searchLocation, currentLocation?.latitude, currentLocation?.longitude]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Climate Analysis &amp; Historical Anomaly</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5-year historical temperature trends and monthly temperature anomaly for <span className="font-semibold text-slate-700 dark:text-slate-200">{currentLocation?.name || 'Selected Location'}</span>.
            </p>
          </div>
        </div>

        <button
          onClick={fetchClimateAnalysis}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-600 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content Area: Loading, Error, or Main Insight Component */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Fetching Historical Climate Archive...</div>
            <div className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Analyzing 5-year Open-Meteo weather records for {currentLocation?.name || 'location'}</div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50/80 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/80 text-red-600 dark:text-red-300 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-200">Failed to Load Climate Data</h3>
            <p className="text-xs text-red-600 dark:text-red-300 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <button
            onClick={fetchClimateAnalysis}
            className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors shadow-xs"
          >
            Try Again
          </button>
        </div>
      ) : (
        <ClimateInsight climateData={climateData} />
      )}
    </div>
  );
}
