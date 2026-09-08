import React from 'react';
import { Calendar, Sun, Cloud, CloudSun, CloudRain, CloudLightning, Wind, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function WeeklyForecast({ weeklyData = [] }) {
  const { t, formatNumber } = useLanguage();

  const renderWeatherIcon = (iconName) => {
    switch (iconName) {
      case 'CloudSun':
        return <CloudSun className="w-4 h-4 text-amber-500" />;
      case 'CloudLightning':
        return <CloudLightning className="w-4 h-4 text-purple-600" />;
      case 'CloudRain':
        return <CloudRain className="w-4 h-4 text-sky-600" />;
      case 'Sun':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'Wind':
        return <Wind className="w-4 h-4 text-slate-500" />;
      case 'Cloud':
      default:
        return <Cloud className="w-4 h-4 text-slate-400" />;
    }
  };

  const allMin = weeklyData && weeklyData.length > 0 ? Math.min(...weeklyData.map((d) => d.minTemp)) : 15;
  const allMax = weeklyData && weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.maxTemp)) : 40;
  const tempRange = (allMax - allMin) || 1;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {t('dashboard.weeklyTitle')}
            </h3>
          </div>

          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
            Open-Meteo
          </span>
        </div>

        {/* Forecast Rows */}
        <div className="space-y-2">
          {weeklyData.map((item, idx) => {
            const leftPct = Math.max(0, Math.min(100, ((item.minTemp - allMin) / tempRange) * 100));
            const rightPct = Math.max(0, Math.min(100, 100 - ((item.maxTemp - allMin) / tempRange) * 100));
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
              >
                {/* Day & Icon */}
                <div className="w-24 sm:w-28 font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-16 truncate">{item.day}</span>
                  {renderWeatherIcon(item.icon)}
                </div>

                {/* Condition */}
                <div className="flex-1 text-slate-600 dark:text-slate-300 text-left hidden sm:block truncate pr-2">
                  {item.condition}
                </div>

                {/* Rain Probability */}
                <div className="w-12 text-right">
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                      item.precip > 50
                        ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                        : item.precip > 20
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                        : 'text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {formatNumber(item.precip)}%
                  </span>
                </div>

                {/* Temp Bar */}
                <div className="w-28 sm:w-32 flex items-center justify-end gap-2 text-right">
                  <span className="text-slate-400 dark:text-slate-400 text-[11px] w-6">{formatNumber(item.minTemp)}°</span>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-sky-400 to-amber-400 rounded-full"
                      style={{
                        left: `${leftPct}%`,
                        right: `${rightPct}%`
                      }}
                    ></div>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-[11px] w-6">{formatNumber(item.maxTemp)}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px] text-slate-400 dark:text-slate-400">High confidence model run</span>
        <button className="font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 hover:translate-x-0.5 transition-transform cursor-pointer">
          <span>{t('forecast.weeklyOutlook')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
