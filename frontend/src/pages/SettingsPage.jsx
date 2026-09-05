import React from 'react';
import { Settings, MapPin, Bell, Globe, Radio, ShieldCheck } from 'lucide-react';

export default function SettingsPage({ currentLocation }) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold shadow-2xs">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Platform Settings</h1>
          <p className="text-xs text-slate-500">
            Configure telemetry sources, alert thresholds, and system preferences for WeatherGPT.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-sky-600" />
            <div>
              <div className="text-sm font-bold text-slate-800">Primary Observation Location</div>
              <div className="text-xs text-slate-500">{currentLocation?.name}</div>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200">
            Amausi (VILK)
          </span>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-sm font-bold text-slate-800">Doppler Telemetry Stream</div>
              <div className="text-xs text-slate-500">IMD Amausi Doppler Reflectivity (dBZ)</div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            Live Connected
          </span>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-sm font-bold text-slate-800">Convective Storm Alert Triggers</div>
              <div className="text-xs text-slate-500">Notify when precipitation probability &gt; 50%</div>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
            Enabled
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-bold text-slate-800">Language Preference</div>
              <div className="text-xs text-slate-500">English, हिंदी, and regional dialect AI output</div>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
            English (ENG)
          </span>
        </div>
      </div>
    </div>
  );
}
