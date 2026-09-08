import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Bell, ChevronDown, Globe, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import EditProfileModal from './EditProfileModal';
import { API_BASE_URL } from '../../config/api';

export default function Header({
  currentLocation,
  onLocationChange,
  onSearch,
  searchError,
  isLoading,
}) {
  const { currentUser, userProfile } = useAuth();
  const { selectedLanguage, setSelectedLanguage, t } = useLanguage();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [geoError, setGeoError] = useState(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayName = userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const photoURL = userProfile?.photoURL || currentUser?.photoURL;
  const initial = displayName ? displayName[0].toUpperCase() : 'U';

  useEffect(() => {
    setImgError(false);
  }, [photoURL]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingSuggestions(true);
      fetch(`${API_BASE_URL}/geocode?query=${encodeURIComponent(searchTerm.trim())}`)
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
    <>
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Location Selector */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
          >
            <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>{currentLocation.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Current Location Pill Badge */}
          <button
            type="button"
            onClick={handleCurrentLocationClick}
            disabled={isLoading || isGeoLoading}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-medium hover:bg-emerald-100/80 dark:hover:bg-emerald-900/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGeoLoading ? (
              <Loader2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-spin" />
            ) : (
              <Navigation className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
            )}
            <span>{isGeoLoading ? 'Getting location...' : 'Current Location'}</span>
          </button>

          {/* Dropdown Menu for Location Selector */}
          {showLocationDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Select Location</span>
                {isSearchingSuggestions && <Loader2 className="w-3 h-3 text-sky-500 animate-spin" />}
              </div>
              {suggestions.length > 0 ? (
                suggestions.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-sky-50 dark:hover:bg-slate-800 ${
                      currentLocation.name?.toLowerCase().includes(loc.name.toLowerCase())
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-100">{loc.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {loc.admin1 ? `${loc.admin1}, ${loc.country}` : loc.country}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
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
              placeholder={t('common.searchPlaceholder')}
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 pl-9 pr-14 py-2 rounded-full border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
            >
              Enter ↵
            </button>
          </form>

          {/* Live Search Suggestions Dropdown Menu */}
          {showSuggestions && searchTerm.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <span>Matching Locations</span>
                {isSearchingSuggestions && <Loader2 className="w-3 h-3 text-sky-500 animate-spin" />}
              </div>
              {suggestions.length > 0 ? (
                suggestions.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{loc.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {loc.admin1 ? `${loc.admin1}, ${loc.country}` : loc.country}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
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
            <div className="absolute top-full left-0 right-0 mt-1 px-3 py-1 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-[11px] font-medium rounded-lg shadow-sm z-30 flex items-center justify-between">
              <span>{geoError || searchError}</span>
            </div>
          )}
        </div>

        {/* Right: Live Status, Language, Notifications, Avatar */}
        <div className="flex items-center gap-3">
          {/* Live Status Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-700 dark:text-slate-200">Live</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-400 text-[11px]">Updated live</span>
          </div>

          {/* Notification Bell */}
          <button className="relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLanguage || 'English'}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent font-semibold hover:text-sky-600 dark:hover:text-sky-400 focus:outline-none cursor-pointer text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="English">ENG (English)</option>
              <option value="Hindi">हिंदी (Hindi)</option>
              <option value="Bengali">বাংলা (Bengali)</option>
              <option value="Tamil">தமிழ் (Tamil)</option>
              <option value="Marathi">मराठी (Marathi)</option>
            </select>
          </div>

          {/* Profile Avatar (Mobile/Header) */}
          <div 
            onClick={() => setIsEditProfileOpen(true)}
            title={`Click to Edit Profile (${displayName})`}
            className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-bold text-xs text-sky-700 overflow-hidden shrink-0 cursor-pointer shadow-2xs hover:border-sky-400 hover:ring-2 hover:ring-sky-100 transition-all relative"
          >
            {photoURL && !imgError ? (
              <img 
                src={photoURL} 
                alt={displayName}
                className="w-full h-full object-cover rounded-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
      />
    </>
  );
}



