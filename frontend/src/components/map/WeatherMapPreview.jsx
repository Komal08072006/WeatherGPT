import React, { useState } from 'react';
import { Map, Layers, Maximize2, Radio, Compass, ArrowRight } from 'lucide-react';

export default function WeatherMapPreview({ onOpenFullMap }) {
  const [activeLayer, setActiveLayer] = useState('rain');

  const layers = [
    { id: 'temp', label: 'Temp' },
    { id: 'rain', label: 'Rain Radar' },
    { id: 'wind', label: 'Wind Vectors' }
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col justify-between">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
            <Map className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Central UP Doppler Radar & Wind Field
          </h3>
        </div>

        {/* Map Layers Selector */}
        <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-1 border border-slate-200/60 text-xs">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
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

      {/* Map Interactive Visualization Frame (Ready for Leaflet/OSM) */}
      <div className="relative w-full h-52 sm:h-56 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 group">
        {/* Geographic Simulated Map Tiles */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-85 transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: `radial-gradient(circle at 45% 55%, rgba(14, 165, 233, 0.45) 0%, rgba(59, 130, 246, 0.25) 30%, transparent 65%), 
                              linear-gradient(to bottom, #1e293b, #0f172a)`
          }}
        >
          {/* Grid lines simulating GIS spatial coords */}
          <div className="w-full h-full opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>

        {/* Doppler Pulse Animation Radar Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 border border-sky-400/40 rounded-full animate-ping pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-sky-300/60 rounded-full pointer-events-none"></div>

        {/* Station Map Pins */}
        {/* Lucknow Station Pin */}
        <div className="absolute top-[48%] left-[46%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 cursor-pointer">
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-md border border-sky-300 text-[10px] font-bold text-slate-900 animate-bounce">
            <Radio className="w-2.5 h-2.5 text-sky-600 animate-pulse" />
            <span>LKO Radar Lucknow 29°C</span>
          </div>
          <div className="w-2.5 h-2.5 bg-sky-500 rounded-full ring-4 ring-sky-300/50 mt-0.5"></div>
        </div>

        {/* Kanpur Pin */}
        <div className="absolute top-[65%] left-[30%] flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-full border border-slate-700 text-[9px] font-semibold">
          <span>Kanpur 31°C</span>
        </div>

        {/* Ayodhya Pin */}
        <div className="absolute top-[35%] left-[70%] flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-full border border-slate-700 text-[9px] font-semibold">
          <span>Ayodhya 28°C</span>
        </div>

        {/* Bottom Bar inside Map */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>LKO-DDR Doppler Reflectivity (dBZ)</span>
          </div>
          <span className="text-slate-400 font-mono">26.8467° N, 80.9462° E</span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-3 pt-2 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Live IMD Doppler & Meteorological Layer</span>
        <button
          onClick={onOpenFullMap}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:translate-x-0.5 transition-transform"
        >
          <span>Open Full Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
