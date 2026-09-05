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

export default function HourlyForecast({ hourlyData = [] }) {
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
          <p className="font-bold text-slate-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            Hourly Forecast & Rain Trajectory
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span>Temp (°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-sky-200 rounded-xs"></span>
            <span>Precip Probability</span>
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
                  ? 'bg-sky-50/90 border-sky-400 shadow-xs ring-2 ring-sky-100'
                  : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-semibold text-slate-500">{item.time}</span>
              <div className="my-0.5">{renderWeatherIcon(item.icon)}</div>
              <span className="text-sm font-bold text-slate-800">{item.temp}°</span>
              <span className="text-[10px] text-slate-500 font-medium">{item.condition}</span>
              <span className="text-[10px] font-bold text-sky-600 bg-sky-100/70 px-1.5 py-0.2 rounded-full">
                {item.precip}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Integrated Recharts Graph */}
      <div className="h-44 sm:h-52 w-full mt-2 pt-2 border-t border-slate-100">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={['dataMin - 2', 'dataMax + 2']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#0284c7', fontSize: 10 }}
              unit="°"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="right"
              dataKey="precip"
              name="Precip Probability"
              fill="#bae6fd"
              radius={[4, 4, 0, 0]}
              barSize={24}
              unit="%"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              name="Temperature"
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ fill: '#0284c7', r: 4 }}
              activeDot={{ r: 6, fill: '#0369a1' }}
              unit="°C"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
