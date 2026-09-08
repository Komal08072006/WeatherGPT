import React, { useState, useRef } from 'react';
import { Sparkles, Mic, Send, Zap, Bot, Loader2, AlertCircle } from 'lucide-react';
import { mockSuggestedPrompts } from '../../data/mockData';
import { SarvamVoiceRecorder } from '../../utils/sarvamAudio';
import { useLanguage } from '../../context/LanguageContext';

export default function WeatherGPTInput({ onAsk, isLoading }) {
  const { selectedLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [notice, setNotice] = useState(null);
  const recorderRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onAsk(query);
  };

  const handleSelectPrompt = (promptText) => {
    setQuery(promptText);
    onAsk(promptText);
  };

  const handleMicClick = async () => {
    setNotice(null);
    if (recordingState === 'idle') {
      try {
        recorderRef.current = new SarvamVoiceRecorder();
        await recorderRef.current.startRecording();
        setRecordingState('recording');
      } catch (err) {
        setRecordingState('idle');
        setNotice(err.message || 'Microphone permission is required for voice input.');
        setTimeout(() => setNotice(null), 4000);
      }
    } else if (recordingState === 'recording') {
      setRecordingState('processing');
      try {
        const result = await recorderRef.current.stopAndTranscribe(selectedLanguage);
        if (result && result.transcript) {
          setQuery(result.transcript);
          setRecordingState('idle');
        } else {
          setRecordingState('idle');
          setNotice('Could not transcribe voice. Please try again.');
          setTimeout(() => setNotice(null), 4000);
        }
      } catch (err) {
        setRecordingState('idle');
        setNotice(err.message || 'Voice service is temporarily unavailable. You can continue using text chat.');
        setTimeout(() => setNotice(null), 4000);
      }
    }
  };

  return (
    <div className="mb-4">
      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested Prompts:
        </span>
        {mockSuggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPrompt(prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/50 text-xs font-medium text-slate-700 transition-all shrink-0 shadow-2xs cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Voice Status / Error Banner */}
      {(recordingState !== 'idle' || notice) && (
        <div className="mb-2">
          {recordingState === 'recording' ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs animate-pulse">
              <span>🔴 Listening... speak your query (Sarvam AI)</span>
              <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-bold">
                Tap Mic to Stop
              </span>
            </div>
          ) : recordingState === 'processing' ? (
            <div className="bg-sky-50 border border-sky-200 text-sky-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
              <span>⏳ Transcribing voice with Sarvam AI...</span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{notice}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-sm focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 transition-all p-1.5">
          <div className="p-2 text-slate-400 pl-3">
            <Bot className="w-5 h-5 text-sky-500" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about the weather in English or Indian languages (हिंदी, বাংলা, தமிழ்...)..."
            className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none px-2 py-2"
          />

          <div className="flex items-center gap-1 pr-1 shrink-0">
            <button
              type="button"
              onClick={handleMicClick}
              disabled={recordingState === 'processing'}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                recordingState === 'recording'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
                  : recordingState === 'processing'
                  ? 'bg-sky-100 text-sky-600'
                  : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'
              }`}
              title={
                recordingState === 'recording'
                  ? 'Listening... tap to stop and transcribe'
                  : 'Voice Input (Sarvam AI STT)'
              }
            >
              {recordingState === 'processing' ? (
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white/20" />
              <span>{isLoading ? 'Processing...' : 'Ask AI'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
