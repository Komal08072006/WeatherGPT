import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
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
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';

export default function WeatherGPTChat({ currentLocation, onNavigateToAlerts }) {
  const { selectedLanguage, t } = useLanguage();
  const [voiceMode, setVoiceMode] = useState(false); // Voice Output (TTS)
  const [isListening, setIsListening] = useState(false); // Voice Input (STT)
  const [voiceInputNotice, setVoiceInputNotice] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voiceFallbackNotice, setVoiceFallbackNotice] = useState(null);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const hasShownVoiceFallbackRef = useRef(false);

  const isHindi = selectedLanguage === 'Hindi';

  // Load browser voices asynchronously
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const list = window.speechSynthesis.getVoices();
        if (list && list.length > 0) {
          setAvailableVoices(list);
          console.log('[TTS] Loaded voices:', list.length);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Cancel speech when Voice Mode turns OFF
  useEffect(() => {
    if (!voiceMode && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [voiceMode]);

  // Suggested Prompts
  const suggestedPrompts = (t('chat.quickPrompts') && Array.isArray(t('chat.quickPrompts')))
    ? t('chat.quickPrompts')
    : [
        "Will it rain tomorrow in Lucknow?",
        "What is the weather in Mumbai?",
        "Is it raining in Delhi right now?",
        "What is the temperature in Kanpur?"
      ];

  // Conversation Thread
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      text: t('chat.initialMessage'),
      sources: "Open-Meteo",
      richContent: null
    }
  ]);

  // Update initial message when language changes if only 1 message exists
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'ai') {
      setMessages([
        {
          id: 1,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
          text: t('chat.initialMessage'),
          sources: "Open-Meteo",
          richContent: null
        }
      ]);
    }
  }, [selectedLanguage]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Speech Recognition (Voice Input) Handler
  const toggleListening = () => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setVoiceInputNotice(
        isHindi
          ? 'वॉइस इनपुट इस ब्राउज़र में उपलब्ध नहीं है — कृपया टाइप करें।'
          : "Voice input is not available in this browser — please type your question instead."
      );
      setTimeout(() => setVoiceInputNotice(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isHindi ? 'hi-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceInputNotice(null);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0].transcript)
          .join('');
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceInputNotice(
            isHindi
              ? 'माइक अनुमति अस्वीकृत — कृपया ब्राउज़र सेटिंग में अनुमति दें।'
              : 'Microphone permission denied — please allow mic access in your browser settings.'
          );
        } else if (event.error !== 'no-speech') {
          setVoiceInputNotice(
            isHindi
              ? 'आवाज़ नहीं पहचानी जा सकी — कृपया पुनः प्रयास करें।'
              : 'Could not recognize speech — please try speaking again.'
          );
        }
        setTimeout(() => setVoiceInputNotice(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      setVoiceInputNotice(
        isHindi
          ? 'वॉइस इनपुट प्रारंभ नहीं हो सका — कृपया पुनः प्रयास करें।'
          : 'Could not start voice input — please try typing.'
      );
      setTimeout(() => setVoiceInputNotice(null), 4000);
    }
  };

  // Speak AI Answer aloud (Voice Output)
  const speakText = (textToSpeak) => {
    console.log('[TTS] speakText called. Voice Mode:', voiceMode, 'Text:', textToSpeak);
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[TTS] speechSynthesis API not supported.');
      setVoiceInputNotice(
        isHindi ? 'वॉइस आउटपुट इस ब्राउज़र में उपलब्ध नहीं है।' : 'Voice output is not available in this browser.'
      );
      setTimeout(() => setVoiceInputNotice(null), 4000);
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      if (!textToSpeak) return;
      const cleanText = textToSpeak.replace(/[*_#`]/g, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = isHindi ? 'hi-IN' : 'en-IN';
      utterance.lang = targetLang;

      const voicesList = availableVoices.length > 0 ? availableVoices : (window.speechSynthesis.getVoices() || []);
      const matchingVoice = voicesList.find(
        (v) => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0])
      );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
        console.log('[TTS] Selected voice:', matchingVoice.name, matchingVoice.lang);
      } else {
        console.log('[TTS] No matching voice for', targetLang, '- using browser default voice.');
        if (selectedLanguage !== 'English') {
          if (!hasShownVoiceFallbackRef.current) {
            hasShownVoiceFallbackRef.current = true;
            setVoiceFallbackNotice(
              isHindi
                ? "Hindi voice isn't installed on this device — text is shown below instead"
                : `${selectedLanguage} voice isn't installed on this device — text is shown below instead`
            );
          }
          return;
        }
      }

      utterance.onstart = () => {
        console.log('[TTS] Audio playback started successfully.');
      };

      utterance.onerror = (err) => {
        console.warn('[TTS] SpeechSynthesis error:', err);
        setVoiceInputNotice(
          isHindi ? 'वॉइस आउटपुट काम नहीं कर सका।' : 'Voice output failed in this browser.'
        );
        setTimeout(() => setVoiceInputNotice(null), 4000);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[TTS] Exception in speakText:', err);
      setVoiceInputNotice(
        isHindi ? 'वॉइस आउटपुट उपलब्ध नहीं है।' : 'Voice output is not available in this browser.'
      );
      setTimeout(() => setVoiceInputNotice(null), 4000);
    }
  };

  const handleSendMessage = async (textToSend) => {
    // Cancel any ongoing speech when user sends a new message
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const query = textToSend || inputText;
    if (!query.trim() || isTyping) return;

    // Stop speech recognition if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
      text: query.trim()
    };

    // Build conversation history context from recent message exchanges (last 4 messages)
    const conversationHistory = messages.slice(-4).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text || ''
    }));
    console.log('[CHAT FRONTEND] Sending conversation_history:', conversationHistory);

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query.trim(),
          language: selectedLanguage,
          conversation_history: conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Something went wrong, please try again.');
      }

      const data = await response.json();
      const answerText = data.simple_answer || 'No answer provided.';

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
        text: answerText,
        sources: `Open-Meteo • ${data.location_used || 'Live Data'}`,
        richContent: miniForecast && miniForecast.length > 0 ? { miniForecast } : null
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Read AI answer aloud if Voice Mode is ON
      if (voiceMode) {
        speakText(answerText);
      }
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

        {/* Controls: Voice Mode Toggle & Language Indicator */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 self-end sm:self-center">
          <div className="flex items-center gap-2.5">
            {/* Voice Mode Toggle (Voice Output) */}
            <button
              type="button"
              onClick={() => {
                const nextState = !voiceMode;
                setVoiceMode(nextState);
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  if (nextState) {
                    console.log('[TTS] Voice Mode turned ON via user click. Warming up audio context.');
                    try {
                      if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                      }
                      window.speechSynthesis.cancel();
                      const warmUp = new SpeechSynthesisUtterance('');
                      window.speechSynthesis.speak(warmUp);
                    } catch (e) {
                      console.warn('[TTS] Audio warmup error:', e);
                    }
                  } else {
                    window.speechSynthesis.cancel();
                  }
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                voiceMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70'
              }`}
              title="Voice Mode: reads AI answers aloud when ON"
            >
              {voiceMode ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>Voice Mode: {voiceMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Language Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>Language: {selectedLanguage}</span>
            </div>
          </div>

          {/* Dismissible voice fallback notice near Voice Mode toggle */}
          {voiceFallbackNotice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{voiceFallbackNotice}</span>
              <button
                type="button"
                onClick={() => setVoiceFallbackNotice(null)}
                className="text-amber-700 hover:text-amber-900 font-bold ml-1 cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
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

      {/* Inline Listening / Error Notice Banner */}
      {(isListening || voiceInputNotice) && (
        <div className="mb-2 shrink-0">
          {isListening ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>{isHindi ? 'सुन रहा हूँ... अपनी बात बोलें' : 'Listening... speak your question now'}</span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{voiceInputNotice}</span>
            </div>
          )}
        </div>
      )}

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
            placeholder={t('chat.inputPlaceholder')}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 px-2 py-1.5 focus:outline-none"
          />

          {/* Mic Button (Voice Input) */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 border border-rose-600 animate-pulse'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={isListening ? 'Listening... (tap to stop)' : 'Voice input (tap to speak)'}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40"
          >
            <span>{t('chat.askAi')}</span>
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
