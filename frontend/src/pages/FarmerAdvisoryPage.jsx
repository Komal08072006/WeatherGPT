import React from 'react';
import FarmerAdvisory from '../components/agriculture/FarmerAdvisory';
import { Sprout } from 'lucide-react';

export default function FarmerAdvisoryPage({ mockFarmerAdvisory, currentLocation, selectedLanguage }) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shadow-2xs">
          <Sprout className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">AI Farmer Advisory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Agro-meteorological crop protocols, irrigation timing, and spraying guidance for <span className="font-semibold text-slate-700 dark:text-slate-200">{currentLocation?.name || 'your location'}</span>.
          </p>
        </div>
      </div>

      {/* Main Advisory Component */}
      <FarmerAdvisory
        currentLocation={currentLocation}
        selectedLanguage={selectedLanguage}
        onViewDetailed={() => alert('Opening Full Krishi Portal...')}
      />
    </div>
  );
}
