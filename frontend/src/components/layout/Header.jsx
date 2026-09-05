import React, { useState } from 'react';
import { MapPin, Navigation, Search, Bell, ChevronDown, Globe, Loader2 } from 'lucide-react';
import { mockLocations } from '../../data/mockData';

export default function Header({
  currentLocation,
  onLocationChange,
  onSearch,
  searchError,
  isLoading
}) {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [language, setLanguage] = useState('ENG');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && onSearch) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Location Selector */}
      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-sky-600 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100/70"
        >
          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
          <span>{currentLocation.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Current Location Pill Badge */}
        <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium hover:bg-emerald-100/80 transition-colors">
          <Navigation className="w-3 h-3 text-emerald-600 fill-emerald-600" />
          <span>Current Location</span>
        </button>

        {/* Dropdown Menu */}
        {showLocationDropdown && (
          <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Select Region
            </div>
            {mockLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  onLocationChange(loc);
                  if (onSearch) onSearch(loc.name);
                  setShowLocationDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                  currentLocation.id === loc.id ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-medium">{loc.name}</div>
                  <div className="text-[10px] text-slate-400">{loc.region}</div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                  {loc.code}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-md relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 focus:outline-none"
            title="Search weather location"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search location (e.g. Lucknow)..."
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 pl-9 pr-14 py-2 rounded-full border border-slate-200/60 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-white text-slate-500 hover:text-sky-600 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs cursor-pointer"
          >
            Enter ↵
          </button>
        </form>
        {searchError && (
          <div className="absolute top-full left-0 right-0 mt-1 px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium rounded-lg shadow-sm z-30 flex items-center justify-between">
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Right: Live Status, Language, Notifications, Avatar */}
      <div className="flex items-center gap-3">
        {/* Live Status Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/60 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-slate-700">Live</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400 text-[11px]">Updated live</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Language Selector */}
        <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/60">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <button 
            onClick={() => setLanguage(language === 'ENG' ? 'हिंदी' : 'ENG')}
            className="font-medium hover:text-sky-600 transition-colors"
          >
            {language}
          </button>
        </div>

        {/* Profile Avatar (Mobile/Header) */}
        <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-semibold text-xs text-sky-700 overflow-hidden shrink-0 cursor-pointer">
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop" 
            alt="User Avatar"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span>PS</span>
        </div>
      </div>
    </header>
  );
}

