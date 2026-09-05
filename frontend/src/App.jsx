import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNavigation from './components/layout/MobileNavigation';

import DashboardPage from './pages/DashboardPage';
import WeatherGPTChat from './components/chat/WeatherGPTChat';
import ForecastPage from './pages/ForecastPage';
import WeatherMapPage from './pages/WeatherMapPage';
import AlertsPage from './pages/AlertsPage';
import FarmerAdvisoryPage from './pages/FarmerAdvisoryPage';
import ClimateAnalysisPage from './pages/ClimateAnalysisPage';
import SettingsPage from './pages/SettingsPage';

import {
  mockLocations,
  mockCurrentWeather,
  mockHourlyForecast,
  mockWeeklyForecast,
  mockWeatherAlert,
  mockFarmerAdvisory,
  mockClimateInsight
} from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentLocation, setCurrentLocation] = useState(mockLocations[0]);
  const [currentWeather, setCurrentWeather] = useState(mockCurrentWeather);
  const [activeViewMode, setActiveViewMode] = useState('normal'); // 'normal' | 'warning' | 'severe' | 'loading'
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const getCleanLocationName = (loc) => {
    if (!loc) return 'Lucknow';
    if (typeof loc === 'string') return loc.split(',')[0].trim();
    if (loc.searchName) return loc.searchName;
    if (loc.name) return loc.name.split(',')[0].trim();
    return 'Lucknow';
  };

  const handleSearch = async (locationQuery) => {
    if (!locationQuery || (typeof locationQuery === 'string' && !locationQuery.trim())) return;
    const cleanSearchName = getCleanLocationName(locationQuery);
    setIsSearchLoading(true);
    setSearchError(null);

    try {
      const response = await fetch(`http://localhost:8000/weather?location=${encodeURIComponent(cleanSearchName)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Location '${cleanSearchName}' not found.`);
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
        return <SettingsPage currentLocation={currentLocation} />;

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
