import React from 'react';
import ClimateInsight from '../components/climate/ClimateInsight';
import { TrendingUp } from 'lucide-react';

export default function ClimateAnalysisPage({ mockClimateInsight, currentLocation }) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
        <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center font-bold shadow-2xs">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Climate Analysis & Long-term Anomaly</h1>
          <p className="text-xs text-slate-500">
            30-year IMD baseline comparisons, monsoon shift trends, and regional temperature variance for <span className="font-semibold text-slate-700">{currentLocation?.name}</span>.
          </p>
        </div>
      </div>

      {/* Main Climate Component */}
      <ClimateInsight
        climateData={mockClimateInsight}
        onViewAnalysis={() => alert('Exporting Climate Anomaly Data...')}
      />
    </div>
  );
}
