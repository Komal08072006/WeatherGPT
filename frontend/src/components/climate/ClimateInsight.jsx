import React from 'react';
import { TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ClimateInsight({ climateData, onViewAnalysis }) {
  if (!climateData) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Climate Insight
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {climateData.subtitle}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
            {climateData.baseline}
          </span>
        </div>

        {/* Metric Summary Card */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 mb-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              WEEKLY TEMP DEVIATION
            </span>
            <span className="text-sm font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {climateData.weeklyDeviation}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {climateData.deviationDesc}
          </p>
        </div>

        {/* 10-Year Monsoon Onset Shift Chart */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span>10-YEAR MONSOON ONSET SHIFT</span>
            <span className="text-sky-600 font-bold">{climateData.monsoonShift}</span>
          </div>

          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={climateData.chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} unit="d" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', fontSize: '11px', borderColor: '#e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="shift"
                  name="Onset Delay (days)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ fill: '#0284c7', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Anomaly Badge */}
        <div className="bg-sky-50/70 border border-sky-200/60 rounded-xl p-2.5 flex items-center gap-2 text-xs text-sky-900">
          <span className="text-sky-600">☔</span>
          <span className="font-medium">{climateData.precipVariance}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px] text-slate-400">IMD Climatology Dataset (1991–2026)</span>
        <button
          onClick={onViewAnalysis}
          className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:translate-x-0.5 transition-transform"
        >
          <span>View Full Climate Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
