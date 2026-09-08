import React from 'react';
import { RotateCw, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function MainWeatherHeader({
  activeViewMode,
  setActiveViewMode,
  locationName,
  conditionText,
  temperature,
  lastUpdated,
  onRefresh
}) {
  const { t, selectedLanguage, formatNumber } = useLanguage();

  const viewModes = [
    { id: 'normal', label: selectedLanguage === 'Hindi' ? 'सामान्य दृश्य' : 'Normal View' },
    { id: 'warning', label: selectedLanguage === 'Hindi' ? 'चेतावनी सिमुलेशन' : 'Simulate Warning' },
    { id: 'severe', label: selectedLanguage === 'Hindi' ? 'गंभीर चेतावनी' : 'Severe Alert' },
    { id: 'loading', label: selectedLanguage === 'Hindi' ? 'एपीआई लोड हो रहा है' : 'API Loading' }
  ];

  const currentHour = new Date().getHours();
  let greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  if (selectedLanguage === 'Hindi') {
    greeting = currentHour < 12 ? 'सुप्रभात' : currentHour < 17 ? 'शुभ अपराह्न' : 'शुभ संध्या';
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      {/* Greeting & Overview */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          {greeting} <span className="animate-bounce inline-block">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
          {selectedLanguage === 'Hindi' ? (
            <>
              यहाँ <span className="font-semibold text-slate-700 dark:text-slate-200">{locationName}</span> का लाइव मौसम और कृषि दृष्टिकोण है
              {conditionText && temperature != null ? `, वर्तमान में ${conditionText} और ${formatNumber(temperature)}°C है।` : '।'}
            </>
          ) : (
            <>
              Here's your real-time atmospheric intelligence & agricultural overview for <span className="font-semibold text-slate-700 dark:text-slate-200">{locationName}</span>
              {conditionText && temperature != null ? `, currently ${conditionText.toLowerCase()} at ${formatNumber(temperature)}°C.` : '.'}
            </>
          )}
        </p>
      </div>

      {/* Demo View Controls & Refresh */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Toggle Pills */}
        <div className="bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveViewMode(mode.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeViewMode === mode.id
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Time Badge & Refresh Button */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-xl shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span className="font-medium text-slate-700 dark:text-slate-200">{formatNumber(lastUpdated)}</span>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold pl-1.5 border-l border-slate-200 dark:border-slate-800 hover:rotate-180 transition-transform duration-300 cursor-pointer"
            title={t('common.refresh')}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
