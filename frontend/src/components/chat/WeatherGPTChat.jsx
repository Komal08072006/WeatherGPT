import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Globe,
  MapPin,
  Bot,
  User,
  Zap,
  TriangleAlert,
  Calendar,
  TrendingUp,
  ShieldCheck,
  Check,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  ArrowUpRight,
  Sliders,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function WeatherGPTChat({ currentLocation, onNavigateToAlerts }) {
  const [voiceMode, setVoiceMode] = useState(false);
  const [language, setLanguage] = useState('ENG');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Suggested Prompts
  const suggestedPrompts = [
    "Will it rain tomorrow in Lucknow?",
    "What is the weather in Mumbai?",
    "Is it raining in Delhi right now?",
    "What is the temperature in Kanpur?",
    "Weather forecast for Bengaluru"
  ];

  // Conversation Thread
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      text: "Hello! I am WeatherGPT. Ask me any weather question about any location (e.g., 'Will it rain in Mumbai tomorrow?').",
      sources: "Open-Meteo",
      richContent: null
    }
  ]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      text: query.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: query.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Something went wrong, please try again.');
      }

      const data = await response.json();

      let miniForecast = null;
      if (data.raw_data && data.raw_data.weather && data.raw_data.weather.current) {
        const current = data.raw_data.weather.current;
        miniForecast = [];

        if (current.temperature_2m != null) {
          miniForecast.push({
            label: 'Temp',
            value: `${Math.round(current.temperature_2m)}°C`,
            icon: Thermometer,
            color: 'text-amber-500'
          });
        }
        if (current.relative_humidity_2m != null) {
          miniForecast.push({
            label: 'Humidity',
            value: `${current.relative_humidity_2m}%`,
            icon: Droplets,
            color: 'text-blue-500'
          });
        }
        if (current.wind_speed_10m != null) {
          miniForecast.push({
            label: 'Wind',
            value: `${current.wind_speed_10m} km/h`,
            icon: Wind,
            color: 'text-slate-600'
          });
        }
        if (current.precipitation != null) {
          miniForecast.push({
            label: 'Precipitation',
            value: `${current.precipitation} mm`,
            icon: CloudRain,
            color: 'text-sky-600'
          });
        }
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        text: data.simple_answer || 'No answer provided.',
        sources: `Open-Meteo • ${data.location_used || 'Live Data'}`,
        richContent: miniForecast && miniForecast.length > 0 ? { miniForecast } : null
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        text: 'Something went wrong, please try again.',
        sources: 'Error',
        richContent: null
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto w-full px-2 sm:px-4 py-2">
      {/* 1. Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/30 shrink-0">
            <Sparkles className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">WeatherGPT</h1>
              <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 px-2.5 py-0.5 rounded-full">
                WeatherGPT-Agro v2.4 (IMD & ECMWF Finetuned)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Conversational meteorological intelligence powered by localized atmospheric AI models.
            </p>
          </div>
        </div>

        {/* Controls: Voice Toggle & Multi-lingual indicator */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {/* Voice Mode Toggle */}
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              voiceMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70'
            }`}
          >
            {voiceMode ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>Voice Mode: {voiceMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Language Toggle Indicator */}
          <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <button
              onClick={() => setLanguage(language === 'ENG' ? 'हिंदी' : language === 'हिंदी' ? 'বাংলা' : 'ENG')}
              className="font-semibold hover:text-sky-600 transition-colors"
            >
              {language} (ENG / हिंदी / বাংলা)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Chat Thread Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI Avatar */}
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-3xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 shadow-xs text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white font-medium rounded-tr-xs'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Rich Sub-Content for AI Messages */}
                {msg.sender === 'ai' && msg.richContent && (
                  <div className="mt-3.5 space-y-3 pt-3 border-t border-slate-100">
                    {/* Practical Tips Highlight Box */}
                    {msg.richContent.tips && msg.richContent.tips.length > 0 && (
                      <div className="space-y-2">
                        {msg.richContent.tips.map((tip, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs ${
                              tip.type === 'agro'
                                ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
                                : 'bg-blue-50/80 border-blue-200/80 text-blue-950'
                            }`}
                          >
                            <div className="font-bold mb-0.5">{tip.title}</div>
                            <div className="text-[11px] leading-relaxed opacity-90">{tip.content}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Embedded Mini Forecast Cards */}
                    {msg.richContent.miniForecast && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Mini Atmospheric Telemetry
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {msg.richContent.miniForecast.map((card, idx) => {
                            const IconComp = card.icon;
                            return (
                              <div
                                key={idx}
                                className="bg-slate-50 border border-slate-200/70 rounded-xl p-2 text-center"
                              >
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  <IconComp className={`w-3.5 h-3.5 ${card.color}`} />
                                  <span className="text-[10px] text-slate-500 font-medium">{card.label}</span>
                                </div>
                                <div className="text-xs font-bold text-slate-800">{card.value}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Alert Confirmation Card */}
                    {msg.richContent.alertConfirmation && (
                      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950">
                            <TriangleAlert className="w-4 h-4 text-amber-600" />
                            <span>{msg.richContent.alertConfirmation.title}</span>
                          </div>
                          <span className="text-[9px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 mb-2">
                          {msg.richContent.alertConfirmation.threshold} • {msg.richContent.alertConfirmation.status}
                        </p>
                        <div className="flex items-center gap-2">
                          {msg.richContent.alertConfirmation.actions.map((act, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                if (act.action === 'view_alerts' && onNavigateToAlerts) {
                                  onNavigateToAlerts();
                                } else {
                                  alert(`Action: ${act.label}`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-[10px] hover:bg-amber-100 transition-colors shadow-2xs"
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Climate Trend Card */}
                    {msg.richContent.climateTrend && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <TrendingUp className="w-3 h-3 text-sky-600" />
                            <span>{msg.richContent.climateTrend.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {msg.richContent.climateTrend.description}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-sky-700 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-xl shrink-0">
                          {msg.richContent.climateTrend.stat}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Source Line & Confidence Footer under AI Message */}
              {msg.sender === 'ai' && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 pl-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Source: {msg.sources}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
              )}

              {/* Timestamp for User Message */}
              {msg.sender === 'user' && (
                <div className="text-[10px] text-slate-400 mt-1 pr-1 text-right font-medium">
                  {msg.timestamp}
                </div>
              )}
            </div>

            {/* User Avatar */}
            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                PS
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-11">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
            <span>WeatherGPT is processing atmospheric models...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 3. Bottom Suggested Prompts Row */}
      <div className="bg-slate-100/60 p-2 rounded-xl border border-slate-200/60 mb-2 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
            Quick Prompts:
          </span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200/90 hover:border-sky-400 hover:bg-sky-50 text-[11px] font-medium text-slate-700 shrink-0 transition-all shadow-2xs"
            >
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Bottom Input Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Location Context Tag */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200/80 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>{currentLocation?.name || 'Lucknow, UP'}</span>
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask WeatherGPT about atmospheric data, crop guidance, travel safety..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 px-2 py-1.5 focus:outline-none"
          />

          {/* Mic Button */}
          <button
            type="button"
            onClick={() => setVoiceMode(!voiceMode)}
            className={`p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${
              voiceMode ? 'text-amber-500 bg-amber-50' : ''
            }`}
            title="Voice Input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40"
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Disclaimer Footer Line */}
        <div className="text-[10px] text-slate-400 text-center mt-1.5 pt-1 border-t border-slate-100">
          WeatherGPT combines high-resolution IMD radar data with ECMWF-HRES ensembles. Double check civic warnings with official bulletins.
        </div>
      </div>
    </div>
  );
}
