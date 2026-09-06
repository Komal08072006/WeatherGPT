import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  CloudSun,
  Map,
  TriangleAlert
} from 'lucide-react';

export default function MobileNavigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'forecast', label: 'Forecast', icon: CloudSun },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: TriangleAlert },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 px-3 flex items-center justify-around z-40 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-sky-600 dark:text-sky-400 font-semibold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <div className={`p-1.5 rounded-full ${isActive ? 'bg-sky-100/80 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
