import React from 'react';
import MainWeatherHeader from '../components/weather/MainWeatherHeader';
import CurrentWeatherCard from '../components/weather/CurrentWeatherCard';
import HourlyForecast from '../components/weather/HourlyForecast';
import WeeklyForecast from '../components/weather/WeeklyForecast';
import WeatherAlert from '../components/alerts/WeatherAlert';
import WeatherMapPreview from '../components/map/WeatherMapPreview';
import FarmerAdvisory from '../components/agriculture/FarmerAdvisory';
import ClimateInsight from '../components/climate/ClimateInsight';
import { AlertTriangle } from 'lucide-react';

export default function DashboardPage({
  currentLocation,
  mockCurrentWeather,
  mockHourlyForecast,
  mockWeeklyForecast,
  mockWeatherAlert,
  mockFarmerAdvisory,
  mockClimateInsight,
  activeViewMode,
  setActiveViewMode,
  handleRefresh,
  onNavigate
}) {
  return (
    <div>
      {/* Main Dashboard Title Header */}
      <MainWeatherHeader
        activeViewMode={activeViewMode}
        setActiveViewMode={setActiveViewMode}
        locationName={currentLocation.name}
        lastUpdated={mockCurrentWeather.lastUpdated}
        onRefresh={handleRefresh}
      />

      {/* Severe Alert Top Notice Banner */}
      {activeViewMode === 'severe' && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold block">IMD Red Warning Active for Central Uttar Pradesh</span>
              Heavy to very heavy convective rainfall with severe cloud-to-ground lightning forecasted.
            </div>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs shrink-0 shadow-xs hover:bg-red-700"
          >
            View Red Alert
          </button>
        </div>
      )}

      {/* Loading Skeleton View */}
      {activeViewMode === 'loading' ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-slate-200 rounded-2xl w-full"></div>
          <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-200 rounded-2xl"></div>
            <div className="h-80 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Main Weather Card */}
          <CurrentWeatherCard
            data={mockCurrentWeather}
            onExploreAIChat={() => onNavigate('ai')}
          />

          {/* Hourly Forecast & Rain Trajectory */}
          <HourlyForecast hourlyData={mockHourlyForecast} />

          {/* Lower Dashboard Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="h-full">
                <WeeklyForecast weeklyData={mockWeeklyForecast} />
              </div>
              <div className="h-full">
                <FarmerAdvisory
                  advisoryData={mockFarmerAdvisory}
                  onViewDetailed={() => onNavigate('advisory')}
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div>
                <WeatherAlert
                  alertData={mockWeatherAlert}
                  onShare={() => alert('Alert link copied to clipboard')}
                  onViewAdvisory={() => onNavigate('alerts')}
                />
              </div>
              <div>
                <WeatherMapPreview
                  onOpenFullMap={() => onNavigate('map')}
                />
              </div>
              <div className="h-full">
                <ClimateInsight
                  climateData={mockClimateInsight}
                  onViewAnalysis={() => onNavigate('climate')}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
