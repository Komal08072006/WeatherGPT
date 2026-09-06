import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Layers, Radio, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

export default function WeatherMapPreview({ currentLocation, onOpenFullMap, isFullPage = false }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const radarLayerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('rain'); // 'rain' | 'base'
  const [isLoading, setIsLoading] = useState(true);
  const [radarError, setRadarError] = useState(false);
  const [radarTime, setRadarTime] = useState('');
  const [weatherData, setWeatherData] = useState(null);

  // Extract coordinates and location name from currentLocation prop
  const lat = currentLocation?.latitude != null ? Number(currentLocation.latitude) : 26.8467;
  const lon = currentLocation?.longitude != null ? Number(currentLocation.longitude) : 80.9462;
  const locationName = currentLocation?.name || 'Lucknow, Uttar Pradesh';

  // Fetch current weather for marker popup from /weather endpoint
  useEffect(() => {
    let isMounted = true;
    const fetchMarkerWeather = async () => {
      try {
        const url = (currentLocation?.latitude != null && currentLocation?.longitude != null)
          ? `http://localhost:8000/weather?latitude=${lat}&longitude=${lon}`
          : `http://localhost:8000/weather?location=${encodeURIComponent(currentLocation?.searchName || currentLocation?.name || 'Lucknow')}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const current = data.weather?.current || {};
            setWeatherData({
              temp: current.temperature_2m != null ? Math.round(current.temperature_2m) : null,
              humidity: current.relative_humidity_2m != null ? current.relative_humidity_2m : null,
              wind: current.wind_speed_10m != null ? current.wind_speed_10m : null,
              location: data.location || locationName,
            });
          }
        }
      } catch (err) {
        console.warn('Weather fetch for map marker failed:', err);
      }
    };

    fetchMarkerWeather();
    return () => { isMounted = false; };
  }, [lat, lon, locationName, currentLocation]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lon], mapInstanceRef.current.getZoom() || 6);
    }

    // Invalidate size after mount to prevent render artifacts
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [lat, lon]);

  // Fetch RainViewer API radar timestamp and create tile layer
  useEffect(() => {
    let isMounted = true;

    const loadRainViewerRadar = async () => {
      setIsLoading(true);
      setRadarError(false);

      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!res.ok) throw new Error('RainViewer API request failed');

        const data = await res.json();
        const host = data.host || 'https://tilecache.rainviewer.com';
        const pastFrames = data.radar?.past || [];

        if (pastFrames.length === 0) throw new Error('No radar data available');

        const latestFrame = pastFrames[pastFrames.length - 1];
        const tileUrlPattern = `${host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

        if (latestFrame.time) {
          const dateObj = new Date(latestFrame.time * 1000);
          setRadarTime(dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }

        if (isMounted && mapInstanceRef.current) {
          if (radarLayerRef.current && mapInstanceRef.current.hasLayer(radarLayerRef.current)) {
            mapInstanceRef.current.removeLayer(radarLayerRef.current);
          }

          const radarTileLayer = L.tileLayer(tileUrlPattern, {
            opacity: 0.65,
            tileSize: 256,
            minZoom: 1,
            maxNativeZoom: 6,
            maxZoom: 7,
            zIndex: 10,
          });

          radarLayerRef.current = radarTileLayer;

          if (activeLayer === 'rain') {
            radarTileLayer.addTo(mapInstanceRef.current);
          }
        }
      } catch (err) {
        console.warn('RainViewer radar overlay error:', err);
        if (isMounted) {
          setRadarError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRainViewerRadar();
    return () => { isMounted = false; };
  }, []);

  // Handle active layer toggle (Rain Radar vs Base Map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeLayer === 'rain' && radarLayerRef.current && !radarError) {
      if (!map.hasLayer(radarLayerRef.current)) {
        radarLayerRef.current.addTo(map);
      }
    } else if (activeLayer === 'base' && radarLayerRef.current) {
      if (map.hasLayer(radarLayerRef.current)) {
        map.removeLayer(radarLayerRef.current);
      }
    }
  }, [activeLayer, radarError]);

  // Update Marker & Popup content at exact coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    const tempText = weatherData?.temp != null ? `${weatherData.temp}°C` : '--°C';
    const cityLabel = locationName.split(',')[0].trim();

    const popupHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 6px; text-align: center; min-width: 130px;">
        <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">${locationName}</strong>
        <div style="font-size: 18px; font-weight: 800; color: #0284c7; margin: 2px 0;">${tempText}</div>
        ${weatherData?.humidity != null ? `<div style="font-size: 11px; color: #64748b;">Humidity: ${weatherData.humidity}%</div>` : ''}
        ${weatherData?.wind != null ? `<div style="font-size: 11px; color: #64748b;">Wind: ${weatherData.wind} km/h</div>` : ''}
      </div>
    `;

    // DivIcon badge
    const customIcon = L.divIcon({
      className: 'custom-weather-marker',
      html: `
        <div style="
          background: #0284c7;
          color: white;
          font-weight: 700;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          border: 2px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          transform: translate(-50%, -100%);
          cursor: pointer;
        ">
          <span>📍 ${cityLabel}</span>
          <span style="background: rgba(255,255,255,0.25); padding: 1px 6px; border-radius: 10px;">${tempText}</span>
        </div>
      `,
      iconSize: [0, 0],
    });

    const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
    marker.bindPopup(popupHTML);
    marker.openPopup();
    markerRef.current = marker;
  }, [lat, lon, locationName, weatherData]);

  const layers = [
    { id: 'rain', label: 'Rain Radar' },
    { id: 'base', label: 'Base Map' },
  ];

  const mapHeightClass = isFullPage ? 'h-[500px] sm:h-[560px]' : 'h-64 sm:h-72';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
            <Map className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Live Rain Radar & Interactive Map
          </h3>
        </div>

        {/* Map Layers Selector */}
        <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-1 border border-slate-200/60 text-xs">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeLayer === layer.id
                  ? 'bg-white text-sky-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet Map Interactive Container */}
      <div className={`relative w-full ${mapHeightClass} bg-slate-900 rounded-xl overflow-hidden border border-slate-200 group`}>
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-xs font-medium">Loading map & radar tiles...</span>
          </div>
        )}

        {/* Radar Error Notice */}
        {radarError && activeLayer === 'rain' && (
          <div className="absolute top-3 left-3 right-3 z-20 bg-amber-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-md backdrop-blur-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Live radar overlay temporarily unavailable. Displaying base map.</span>
          </div>
        )}

        {/* Leaflet Map Element */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Bottom Status Overlay Bar */}
        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-[10px] bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${activeLayer === 'rain' && !radarError ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
            <span>
              {activeLayer === 'rain' && !radarError
                ? `Live Rain Radar (RainViewer${radarTime ? ` • ${radarTime}` : ''})`
                : 'OpenStreetMap Base Layer'}
            </span>
          </div>
          <span className="text-slate-400 font-mono">
            {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
          </span>
        </div>
      </div>

      {/* Footer Action / Info */}
      <div className="mt-3 pt-2 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400">
          Live radar data: RainViewer • Base map: OpenStreetMap
        </span>
        {onOpenFullMap && (
          <button
            onClick={onOpenFullMap}
            className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:translate-x-0.5 transition-transform"
          >
            <span>Full Map View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
