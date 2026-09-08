import React, { useState } from 'react';
import {
  Clock,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  Moon
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useLanguage } from '../../context/LanguageContext';

export default function HourlyForecast({ hourlyData = [] }) {
  const { t, formatNumber } = useLanguage();
  const [selectedHour, setSelectedHour] = useState(null);

  const activeHour = selectedHour || (hourlyData.length > 0 ? hourlyData[0].time : '');

  // Helper icon generator
  const renderWeatherIcon = (iconName) => {
    switch (iconName) {
      case 'SunCloud':
      case 'CloudSun':
        return <CloudSun className="w-5 h-5 text-amber-500" />;
      case 'Cloud':
        return <Cloud className="w-5 h-5 text-slate-400" />;
      case 'CloudDrizzle':
        return <CloudDrizzle className="w-5 h-5 text-sky-400" />;
      case 'CloudRain':
        return <CloudRain className="w-5 h-5 text-sky-600" />;
      case 'Moon':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      default:
        return <Sun className="w-5 h-5 text-amber-500" />;
    }
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-slate-200 rounded-xl p-2.5 shadow-lg text-xs space-y-1">
          <p className="font-bold text-slate-800">{formatNumber(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="font-medium" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}{entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {t('dashboard.hourlyTitle')}
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span>Temp (°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-sky-200 dark:bg-sky-700/60 rounded-xs"></span>
            <span>{t('forecast.precipChance')}</span>
          </div>
        </div>
      </div>

      {/* Hourly Card Strip (Horizontal Scroll on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
        {hourlyData.map((item, idx) => {
          const isSelected = activeHour === item.time || (idx === 0 && !selectedHour);
          return (
            <button
              key={idx}
              onClick={() => setSelectedHour(item.time)}
              className={`flex-1 min-w-[76px] sm:min-w-[88px] p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-sky-50/90 dark:bg-sky-950/80 border-sky-400 dark:border-sky-500 shadow-xs ring-2 ring-sky-100 dark:ring-sky-900/50'
                  : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{formatNumber(item.time)}</span>
              <div className="my-0.5">{renderWeatherIcon(item.icon)}</div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatNumber(item.temp)}°</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{item.condition}</span>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100/70 dark:bg-sky-950/80 px-1.5 py-0.2 rounded-full">
                {formatNumber(item.precip)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Integrated Recharts Graph */}
      <div className="h-44 sm:h-52 w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={['dataMin - 2', 'dataMax + 2']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#38bdf8', fontSize: 10 }}
              unit="°"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="right"
              dataKey="precip"
              name="Precip Probability"
              fill="#0284c7"
              radius={[4, 4, 0, 0]}
              barSize={24}
              unit="%"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              name="Temperature"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ fill: '#38bdf8', r: 4 }}
              activeDot={{ r: 6, fill: '#0284c7' }}
              unit="°C"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
