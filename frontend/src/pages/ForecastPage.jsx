import React from 'react';
import HourlyForecast from '../components/weather/HourlyForecast';
import WeeklyForecast from '../components/weather/WeeklyForecast';
import { CloudSun } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ForecastPage({ mockHourlyForecast, mockWeeklyForecast, currentLocation }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shadow-2xs">
          <CloudSun className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('forecast.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('forecast.subtitle')} — <span className="font-semibold text-slate-700 dark:text-slate-200">{currentLocation?.name}</span>.
          </p>
        </div>
      </div>

      {/* Hourly Forecast */}
      <HourlyForecast hourlyData={mockHourlyForecast} />

      {/* Weekly 7-Day Forecast */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        <WeeklyForecast weeklyData={mockWeeklyForecast} />
      </div>
    </div>
  );
}
