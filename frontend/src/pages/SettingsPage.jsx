import React from 'react';
import { Settings, MapPin, Bell, Globe, Radio, Sun, Moon } from 'lucide-react';

export default function SettingsPage({
  currentLocation,
  selectedLanguage = 'English',
  onLanguageChange,
  theme = 'light',
  onThemeChange
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold shadow-2xs">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Platform Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure telemetry sources, alert thresholds, appearance, and language preferences for WeatherGPT.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
        {/* Primary Location */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Primary Observation Location</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{currentLocation?.name || 'Lucknow, Uttar Pradesh'}</div>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-3 py-1 rounded-xl border border-sky-200 dark:border-sky-800/60">
            {currentLocation?.searchName || 'Amausi (VILK)'}
          </span>
        </div>

        {/* Doppler Stream */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Doppler Telemetry Stream</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">IMD Doppler Reflectivity (dBZ) &amp; Open-Meteo Radar</div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            Live Connected
          </span>
        </div>

        {/* Alert Triggers */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Convective Storm Alert Triggers</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Notify when precipitation probability &gt; 50%</div>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60">
            Enabled
          </span>
        </div>

        {/* Language Preference (Synced with Header & App state) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Language Preference</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                English, हिंदी, বাংলা, தமிழ், and मराठी AI output
              </div>
            </div>
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
            className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="English">English (ENG)</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Bengali">বাংলা (Bengali)</option>
            <option value="Tamil">தமிழ் (Tamil)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>
        </div>

        {/* Appearance / Theme Toggle (Global Light / Dark Mode) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Appearance</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Switch between Light and Dark mode across the application
              </div>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('light')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('dark')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 dark:bg-slate-900 text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
