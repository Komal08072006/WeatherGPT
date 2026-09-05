import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Bell, ChevronDown, Globe, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({
  currentLocation,
  onLocationChange,
  onSearch,
  searchError,
  isLoading
}) {
  const { currentUser, userProfile } = useAuth();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [language, setLanguage] = useState('ENG');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [geoError, setGeoError] = useState(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingSuggestions(true);
      fetch(`http://localhost:8000/geocode?query=${encodeURIComponent(searchTerm.trim())}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setSuggestions(data || []);
          setShowSuggestions(true);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => {
          setIsSearchingSuggestions(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCurrentLocationClick = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser. Please search for your city instead.");
      return;
    }

    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGeoLoading(false);
        if (onSearch) {
          onSearch({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      },
      (error) => {
        setIsGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Location access denied. Please search for your city instead.");
        } else {
          setGeoError("Location access denied. Please search for your city instead.");
        }
      },
      { timeout: 10000 }
    );
  };

  const handleSelectLocation = (loc) => {
    setGeoError(null);
    if (onSearch) {
      onSearch(loc.name);
    }
    setShowSuggestions(false);
    setShowLocationDropdown(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setGeoError(null);
    if (searchTerm.trim() && onSearch) {
      if (suggestions.length > 0) {
        handleSelectLocation(suggestions[0]);
      } else {
        onSearch(searchTerm.trim());
        setShowSuggestions(false);
      }
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
        <button
          type="button"
          onClick={handleCurrentLocationClick}
          disabled={isLoading || isGeoLoading}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-medium hover:bg-emerald-100/80 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isGeoLoading ? (
            <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
          ) : (
            <Navigation className="w-3 h-3 text-emerald-600 fill-emerald-600" />
          )}
          <span>{isGeoLoading ? 'Getting location...' : 'Current Location'}</span>
        </button>

        {/* Dropdown Menu for Location Selector */}
        {showLocationDropdown && (
          <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Select Location</span>
              {isSearchingSuggestions && <Loader2 className="w-3 h-3 text-sky-500 animate-spin" />}
            </div>
            {suggestions.length > 0 ? (
              suggestions.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(loc)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-sky-50 ${
                    currentLocation.name?.toLowerCase().includes(loc.name.toLowerCase())
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-800">{loc.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {loc.admin1 ? `${loc.admin1}, ${loc.country}` : loc.country}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    {loc.country}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-slate-400 text-center italic">
                Type in search bar to search cities
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Search Bar with Live Suggestions Dropdown */}
      <div className="flex-1 max-w-xs sm:max-w-md relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 focus:outline-none"
            title="Search weather location"
          >
            {isLoading || isSearchingSuggestions ? (
              <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search location (e.g. Lucknow, Delhi, Mumbai)..."
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 pl-9 pr-14 py-2 rounded-full border border-slate-200/60 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-white text-slate-500 hover:text-sky-600 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs cursor-pointer"
          >
            Enter ↵
          </button>
        </form>

        {/* Live Search Suggestions Dropdown Menu */}
        {showSuggestions && searchTerm.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
              <span>Matching Locations</span>
              {isSearchingSuggestions && <Loader2 className="w-3 h-3 text-sky-500 animate-spin" />}
            </div>
            {suggestions.length > 0 ? (
              suggestions.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-sky-50 text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">{loc.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {loc.admin1 ? `${loc.admin1}, ${loc.country}` : loc.country}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    {loc.country}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-slate-400 text-center italic">
                No matching locations found
              </div>
            )}
          </div>
        )}

        {(searchError || geoError) && (
          <div className="absolute top-full left-0 right-0 mt-1 px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium rounded-lg shadow-sm z-30 flex items-center justify-between">
            <span>{geoError || searchError}</span>
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
        <div 
          title={userProfile?.name || currentUser?.displayName || 'User Profile'}
          className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-bold text-xs text-sky-700 overflow-hidden shrink-0 cursor-pointer shadow-2xs"
        >
          {(userProfile?.photoURL || currentUser?.photoURL) ? (
            <img 
              src={userProfile?.photoURL || currentUser?.photoURL} 
              alt={userProfile?.name || 'User Avatar'}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : null}
          <span>
            {userProfile?.name ? userProfile.name[0].toUpperCase() : currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
          </span>
        </div>
      </div>
    </header>
  );
}


