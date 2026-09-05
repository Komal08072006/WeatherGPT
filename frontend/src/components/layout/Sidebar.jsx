import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  CloudSun,
  Map,
  TriangleAlert,
  Sprout,
  TrendingUp,
  Settings,
  HelpCircle,
  Cloud
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai', label: 'WeatherGPT', icon: Sparkles },
    { id: 'forecast', label: 'Forecast', icon: CloudSun },
    { id: 'map', label: 'Weather Map', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: TriangleAlert },
    { id: 'advisory', label: 'Farmer Advisory', icon: Sprout },
    { id: 'climate', label: 'Climate Analysis', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-52 lg:w-56 bg-white border-r border-slate-200/80 min-h-screen sticky top-0 h-screen z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-2.5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/30">
          <Cloud className="w-5 h-5 stroke-[2.5]" />
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">
          Weather<span className="text-sky-600">GPT</span>
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 font-medium ${
                isActive
                  ? 'bg-sky-50 text-sky-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 stroke-[2.2]' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-white transition-colors">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Help & Support</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-semibold text-xs text-sky-700 overflow-hidden shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop" 
              alt="Dr. Priya Sharma" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span>PS</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">Dr. Priya Sharma</p>
            <p className="text-[10px] text-slate-400 truncate">Agro-Met Researcher</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
