import React from 'react';
import { TrendingUp, CloudRain } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useLanguage } from '../../context/LanguageContext';

export default function ClimateInsight({ climateData }) {
  const { t, formatNumber } = useLanguage();
  if (!climateData) return null;

  const anomaly = climateData.anomaly_celsius ?? 0.0;
  const isPositive = anomaly > 0;
  const isNegative = anomaly < 0;
  const anomalyFormatted = `${isPositive ? '+' : ''}${formatNumber(anomaly.toFixed(1))}°C`;

  const anomalyBadgeStyle = isPositive
    ? 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/60'
    : isNegative
    ? 'text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800/60'
    : 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/60';

  const yearlyAverages = climateData.yearly_averages || [];
  const totalPrecip = yearlyAverages.reduce((acc, curr) => acc + (curr.avg_precipitation || 0), 0);
  const avgMonthlyPrecip = yearlyAverages.length > 0 ? (totalPrecip / yearlyAverages.length).toFixed(1) : '0.0';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                {t('climate.insightsTitle')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Historical monthly temperature &amp; precipitation analysis for {climateData.location}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
            {climateData.source || 'Open-Meteo Historical Archive'}
          </span>
        </div>

        {/* Metric Summary Card */}
        <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              THIS MONTH VS 5-YEAR AVERAGE
            </span>
            <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full border ${anomalyBadgeStyle}`}>
              {anomalyFormatted}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Current month-to-date average temperature of <span className="font-semibold text-slate-800 dark:text-slate-100">{formatNumber(climateData.current_month_avg_temp)}°C</span> compared to the 5-year historical average of <span className="font-semibold text-slate-800 dark:text-slate-100">{formatNumber(climateData.five_year_avg_temp)}°C</span> for {climateData.current_month}.
          </p>
        </div>

        {/* 5-Year Monthly Temperature Trend Line Chart */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>5-YEAR TEMPERATURE TREND ({climateData.current_month?.toUpperCase()})</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">Past 5 Years Avg ({formatNumber(climateData.five_year_avg_temp)}°C)</span>
          </div>

          <div className="h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyAverages} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="°C" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', fontSize: '11px', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(value) => [`${formatNumber(value)}°C`, 'Avg Temperature']}
                  labelFormatter={(label) => `Year ${formatNumber(label)}`}
                />
                <Line
                  type="monotone"
                  dataKey="avg_temp"
                  name="Avg Temperature (°C)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ fill: '#38bdf8', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation Historical Summary Badge */}
        <div className="bg-sky-50/70 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800/60 rounded-xl p-3 flex items-center justify-between text-xs text-sky-900 dark:text-sky-200">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-medium">5-Year Monthly Total Precipitation Avg ({climateData.current_month})</span>
          </div>
          <span className="font-bold text-sky-700 dark:text-sky-300">{formatNumber(avgMonthlyPrecip)} mm</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px] text-slate-400 dark:text-slate-400">{climateData.source || 'Open-Meteo Historical Archive'}</span>
        <span className="text-[11px] text-slate-400 dark:text-slate-400 italic">Computed from Open-Meteo Archive API</span>
      </div>
    </div>
  );
}
