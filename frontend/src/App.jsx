import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNavigation from './components/layout/MobileNavigation';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

import DashboardPage from './pages/DashboardPage';
import WeatherGPTChat from './components/chat/WeatherGPTChat';
import ForecastPage from './pages/ForecastPage';
import WeatherMapPage from './pages/WeatherMapPage';
import AlertsPage from './pages/AlertsPage';
import FarmerAdvisoryPage from './pages/FarmerAdvisoryPage';
import ClimateAnalysisPage from './pages/ClimateAnalysisPage';
import SettingsPage from './pages/SettingsPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2, Cloud } from 'lucide-react';
import { API_BASE_URL } from './config/api';

import {
  mockLocations,
  mockCurrentWeather,
  mockHourlyForecast,
  mockWeeklyForecast,
  mockWeatherAlert,
  mockFarmerAdvisory,
  mockClimateInsight
} from './data/mockData';

function ExistingDashboard() {
  const { loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentLocation, setCurrentLocation] = useState(mockLocations[0]);
  const [currentWeather, setCurrentWeather] = useState(mockCurrentWeather);
  const [activeViewMode, setActiveViewMode] = useState('normal'); // 'normal' | 'warning' | 'severe' | 'loading'
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [theme, setTheme] = useState('light');

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25 animate-pulse">
          <Cloud className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
          <span>Authenticating WeatherGPT session...</span>
        </div>
      </div>
    );
  }

  const getCleanLocationName = (loc) => {
    if (!loc) return 'Lucknow';
    if (typeof loc === 'string') return loc.split(',')[0].trim();
    if (loc.searchName) return loc.searchName;
    if (loc.name) return loc.name.split(',')[0].trim();
    return 'Lucknow';
  };

  const handleSearch = async (locationQuery) => {
    if (!locationQuery) return;
    setIsSearchLoading(true);
    setSearchError(null);

    try {
      let url = '';
      if (typeof locationQuery === 'object' && locationQuery.latitude != null && locationQuery.longitude != null) {
        url = `${API_BASE_URL}/weather?latitude=${locationQuery.latitude}&longitude=${locationQuery.longitude}`;
      } else {
        if (typeof locationQuery === 'string' && !locationQuery.trim()) {
          setIsSearchLoading(false);
          return;
        }
        const cleanSearchName = getCleanLocationName(locationQuery);
        url = `${API_BASE_URL}/weather?location=${encodeURIComponent(cleanSearchName)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch weather data');
      }

      const data = await response.json();
      const curr = data.weather?.current || {};

      const tempVal = curr.temperature_2m != null ? Math.round(curr.temperature_2m) : mockCurrentWeather.temperature;
      const humidityVal = curr.relative_humidity_2m != null ? `${curr.relative_humidity_2m}%` : mockCurrentWeather.metrics.humidity.value;
      const windVal = curr.wind_speed_10m != null ? `${curr.wind_speed_10m} km/h` : mockCurrentWeather.metrics.wind.value;
      const precipVal = curr.precipitation != null ? `${curr.precipitation} mm` : mockCurrentWeather.metrics.precipProb.value;

      const formattedDisplayName = data.admin1
        ? `${data.location}, ${data.admin1}`
        : data.country
        ? `${data.location}, ${data.country}`
        : data.location;

      setCurrentLocation({
        id: data.location.toLowerCase(),
        name: formattedDisplayName,
        searchName: data.location,
        latitude: data.coordinates.latitude,
        longitude: data.coordinates.longitude,
        region: data.admin1 ? `${data.admin1}, ${data.country}` : data.country || 'Region',
        code: `${data.coordinates.latitude.toFixed(2)}°, ${data.coordinates.longitude.toFixed(2)}°`
      });

      setCurrentWeather((prev) => ({
        ...prev,
        location: formattedDisplayName,
        country: data.country || 'India',
        basin: data.admin1 || prev.basin,
        temperature: tempVal,
        feelsLike: tempVal,
        lastUpdated: 'Just now (Live API)',
        metrics: {
          ...prev.metrics,
          humidity: {
            ...prev.metrics.humidity,
            value: humidityVal,
            subText: 'Live sensor reading'
          },
          wind: {
            ...prev.metrics.wind,
            value: windVal,
            subText: '10m elevation'
          },
          precipProb: {
            ...prev.metrics.precipProb,
            label: 'Precipitation',
            value: precipVal,
            subText: 'Current rainfall'
          }
        }
      }));
    } catch (err) {
      setSearchError(err.message || 'Failed to fetch weather data');
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleRefresh = () => {
    const target = currentLocation?.searchName || getCleanLocationName(currentLocation);
    if (target) {
      handleSearch(target);
    } else {
      setActiveViewMode('loading');
      setTimeout(() => {
        setActiveViewMode('normal');
      }, 800);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'ai':
      case 'weathergpt':
        return (
          <WeatherGPTChat
            currentLocation={currentLocation}
            selectedLanguage={selectedLanguage}
            onNavigateToAlerts={() => handleTabChange('alerts')}
          />
        );

      case 'forecast':
      case 'weather-forecast':
        return (
          <ForecastPage
            mockHourlyForecast={mockHourlyForecast}
            mockWeeklyForecast={mockWeeklyForecast}
            currentLocation={currentLocation}
          />
        );

      case 'map':
      case 'weather-map':
        return <WeatherMapPage currentLocation={currentLocation} />;

      case 'alerts':
        return (
          <AlertsPage
            mockWeatherAlert={mockWeatherAlert}
            currentLocation={currentLocation}
          />
        );

      case 'advisory':
      case 'farmer-advisory':
        return (
          <FarmerAdvisoryPage
            mockFarmerAdvisory={mockFarmerAdvisory}
            currentLocation={currentLocation}
            selectedLanguage={selectedLanguage}
          />
        );

      case 'climate':
      case 'climate-analysis':
        return (
          <ClimateAnalysisPage
            mockClimateInsight={mockClimateInsight}
            currentLocation={currentLocation}
          />
        );

      case 'settings':
        return (
          <SettingsPage
            currentLocation={currentLocation}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            theme={theme}
            onThemeChange={setTheme}
          />
        );

      case 'dashboard':
      default:
        return (
          <DashboardPage
            currentLocation={currentLocation}
            mockCurrentWeather={currentWeather}
            mockHourlyForecast={mockHourlyForecast}
            mockWeeklyForecast={mockWeeklyForecast}
            mockWeatherAlert={mockWeatherAlert}
            mockFarmerAdvisory={mockFarmerAdvisory}
            mockClimateInsight={mockClimateInsight}
            activeViewMode={isSearchLoading ? 'loading' : activeViewMode}
            setActiveViewMode={setActiveViewMode}
            handleRefresh={handleRefresh}
            onNavigate={handleTabChange}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased font-sans">
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Top Header */}
        <Header
          currentLocation={currentLocation}
          onLocationChange={setCurrentLocation}
          onSearch={handleSearch}
          searchError={searchError}
          isLoading={isSearchLoading}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />

        {/* Page Container */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25 animate-pulse">
          <Cloud className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
          <span>Authenticating WeatherGPT session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard/*" element={<ProtectedRoute><ExistingDashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><ExistingDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


