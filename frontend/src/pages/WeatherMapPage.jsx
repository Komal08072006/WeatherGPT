import React from 'react';
import WeatherMapPreview from '../components/map/WeatherMapPreview';
import { Map } from 'lucide-react';

export default function WeatherMapPage({ currentLocation }) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
        <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center font-bold shadow-2xs">
          <Map className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Weather Radar & Live Map</h1>
          <p className="text-xs text-slate-500">
            Live rain radar and current conditions map centered over <span className="font-semibold text-slate-700">{currentLocation?.name || 'Selected Location'}</span>.
          </p>
        </div>
      </div>

      {/* Weather Map View */}
      <WeatherMapPreview currentLocation={currentLocation} isFullPage={true} />
    </div>
  );
}
