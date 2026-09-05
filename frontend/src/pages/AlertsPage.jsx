import React from 'react';
import WeatherAlert from '../components/alerts/WeatherAlert';
import { TriangleAlert } from 'lucide-react';

export default function AlertsPage({ mockWeatherAlert, currentLocation }) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
          <TriangleAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Weather Alerts & Warning Bulletins</h1>
          <p className="text-xs text-slate-500">
            Active atmospheric warnings, severe weather bulletins, and threshold triggers for <span className="font-semibold text-slate-700">{currentLocation?.name}</span>.
          </p>
        </div>
      </div>

      {/* Main Alert Card */}
      <WeatherAlert
        alertData={mockWeatherAlert}
        onShare={() => alert('Alert link copied to clipboard')}
        onViewAdvisory={() => alert('Opening Official Bulletin...')}
      />
    </div>
  );
}
