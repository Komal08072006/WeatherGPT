import React from 'react';
import {
  MapPin,
  Radio,
  Sun,
  CloudSun,
  Droplets,
  Wind,
  CloudRain,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import WeatherMetric from './WeatherMetric';

export default function CurrentWeatherCard({ data, onExploreAIChat }) {
  if (!data) return null;

  const condition = data.condition || 'Clear';
  const isRainy = condition.toLowerCase().includes('rain');
  const WeatherIcon = isRainy ? CloudRain : condition.toLowerCase().includes('cloud') || condition.toLowerCase().includes('overcast') ? CloudSun : Sun;

  return (
    <div className="bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-indigo-50/60 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/90 border border-sky-100 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm mb-6 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-200/40 dark:bg-sky-900/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Location & Station Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-sky-100/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-sm">
            <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>{data.location}</span>
          </div>

          {(data.country || data.admin1) && (
            <>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="bg-white/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                {[data.admin1, data.country].filter(Boolean).join(', ')}
              </span>
            </>
          )}

          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Station: Open-Meteo Live API
          </span>
        </div>

        {/* Doppler Live Badge */}
        <div className="bg-white/90 dark:bg-slate-800/90 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Live Station</span>
        </div>
      </div>

      {/* Main Content Layout: Temp Display (Left) + Metric Cards Grid (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-5">
        {/* Left Column: Temperature & Main Icon */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            {/* Weather Icon */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-sky-400 p-0.5 shadow-md shadow-amber-400/20">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <WeatherIcon className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Main Temperature */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  {data.temperature != null ? `${data.temperature}°C` : '--'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{condition}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Live API Reading</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3 Metric Sub-cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <WeatherMetric
            label="HUMIDITY"
            value={data.metrics?.humidity?.value || '--'}
            subText={data.metrics?.humidity?.subText || 'Relative humidity'}
            icon={Droplets}
          />
          <WeatherMetric
            label="WIND SPEED"
            value={data.metrics?.wind?.value || '--'}
            subText={data.metrics?.wind?.subText || '10m elevation'}
            icon={Wind}
          />
          <WeatherMetric
            label="PRECIP PROB"
            value={data.metrics?.precipProb?.value || '--'}
            subText={data.metrics?.precipProb?.subText || 'Current precipitation'}
            icon={CloudRain}
          />
        </div>
      </div>

      {/* Bottom WeatherGPT Quick Insight Banner */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-sky-200/80 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-4 h-4 fill-sky-500/20" />
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="font-bold text-sky-700 dark:text-sky-400 mr-1.5">WeatherGPT Overview:</span>
            Current conditions in {data.location}: {condition}, {data.temperature}°C with {data.metrics?.humidity?.value || '--'} humidity and {data.metrics?.wind?.value || '--'} wind speed.
          </div>
        </div>

        <button
          onClick={onExploreAIChat}
          className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 shrink-0 self-end sm:self-center hover:translate-x-0.5 transition-transform"
        >
          <span>Explore in AI Chat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
