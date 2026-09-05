import React, { useState, useEffect } from 'react';
import MainWeatherHeader from '../components/weather/MainWeatherHeader';
import CurrentWeatherCard from '../components/weather/CurrentWeatherCard';
import HourlyForecast from '../components/weather/HourlyForecast';
import WeeklyForecast from '../components/weather/WeeklyForecast';
import WeatherAlert from '../components/alerts/WeatherAlert';
import WeatherMapPreview from '../components/map/WeatherMapPreview';
import FarmerAdvisory from '../components/agriculture/FarmerAdvisory';
import ClimateInsight from '../components/climate/ClimateInsight';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
  const [realWeather, setRealWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchLocation = currentLocation?.searchName || (currentLocation?.name ? currentLocation.name.split(',')[0].trim() : 'Lucknow');
  const displayLocation = currentLocation?.name || 'Lucknow';

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = (currentLocation?.latitude != null && currentLocation?.longitude != null)
        ? `http://localhost:8000/weather?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}`
        : `http://localhost:8000/weather?location=${encodeURIComponent(searchLocation)}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to fetch weather for ${displayLocation}`);
      }
      const data = await res.json();
      setRealWeather(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [searchLocation, currentLocation?.latitude, currentLocation?.longitude]);

  const onManualRefresh = () => {
    fetchWeather();
    if (handleRefresh) handleRefresh();
  };

  // Derive display fields from real weather API response
  const weatherObj = realWeather?.weather || {};
  const curr = weatherObj.current || {};
  const hourly = weatherObj.hourly || {};

  const tempVal = curr.temperature_2m != null ? Math.round(curr.temperature_2m) : null;
  const humidityVal = curr.relative_humidity_2m != null ? `${curr.relative_humidity_2m}%` : '--';
  const windVal = curr.wind_speed_10m != null ? `${curr.wind_speed_10m} km/h` : '--';
  const precipAmount = curr.precipitation != null ? curr.precipitation : 0;

  let currentPrecipProb = 0;
  if (hourly.time && hourly.precipitation_probability) {
    const nowIso = new Date().toISOString().slice(0, 13);
    const idx = hourly.time.findIndex((t) => t.startsWith(nowIso));
    if (idx !== -1 && hourly.precipitation_probability[idx] != null) {
      currentPrecipProb = hourly.precipitation_probability[idx];
    } else if (hourly.precipitation_probability.length > 0) {
      currentPrecipProb = hourly.precipitation_probability[0];
    }
  }

  let conditionText = 'Clear';
  if (precipAmount > 0.5) {
    conditionText = 'Rainy';
  } else if (precipAmount > 0) {
    conditionText = 'Light Rain';
  } else if (currentPrecipProb > 60) {
    conditionText = 'Overcast';
  } else if (curr.relative_humidity_2m > 80) {
    conditionText = 'Partly Cloudy';
  }

  const formattedDisplayName = realWeather?.admin1
    ? `${realWeather.location}, ${realWeather.admin1}`
    : realWeather?.country
    ? `${realWeather.location}, ${realWeather.country}`
    : realWeather?.location || displayLocation;

  const cardData = {
    location: formattedDisplayName,
    country: realWeather?.country || '',
    admin1: realWeather?.admin1 || '',
    temperature: tempVal,
    condition: conditionText,
    metrics: {
      humidity: {
        label: 'HUMIDITY',
        value: humidityVal,
        subText: 'Relative humidity'
      },
      wind: {
        label: 'WIND SPEED',
        value: windVal,
        subText: '10m elevation'
      },
      precipProb: {
        label: 'PRECIP PROB',
        value: `${currentPrecipProb}%`,
        subText: `Current precip: ${precipAmount} mm`
      }
    }
  };

  const isViewLoading = loading || activeViewMode === 'loading';

  return (
    <div>
      {/* Main Dashboard Title Header */}
      <MainWeatherHeader
        activeViewMode={activeViewMode}
        setActiveViewMode={setActiveViewMode}
        locationName={formattedDisplayName}
        conditionText={conditionText}
        temperature={tempVal}
        lastUpdated="Live API"
        onRefresh={onManualRefresh}
      />

      {/* Severe Alert Top Notice Banner */}
      {activeViewMode === 'severe' && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold block">IMD Red Warning Active</span>
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

      {/* Error Banner */}
      {error && !isViewLoading && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium shadow-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchWeather}
            className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton View */}
      {isViewLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-slate-200 rounded-2xl w-full flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Fetching real weather data...</span>
          </div>
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
            data={cardData}
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
