import React from 'react';
import HourlyForecast from '../components/weather/HourlyForecast';
import WeeklyForecast from '../components/weather/WeeklyForecast';
import { CloudSun } from 'lucide-react';

export default function ForecastPage({ mockHourlyForecast, mockWeeklyForecast, currentLocation }) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
        <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center font-bold shadow-2xs">
          <CloudSun className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Weather Forecast</h1>
          <p className="text-xs text-slate-500">
            Hourly rain trajectory & 7-day agro-meteorological outlook for <span className="font-semibold text-slate-700">{currentLocation?.name}</span>.
          </p>
        </div>
      </div>

      {/* Hourly Forecast */}
      <HourlyForecast hourlyData={mockHourlyForecast} />

      {/* Weekly 7-Day Forecast */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <WeeklyForecast weeklyData={mockWeeklyForecast} />
      </div>
    </div>
  );
}
