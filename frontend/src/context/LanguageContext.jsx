import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('weathergpt_language');
      return saved || 'English';
    } catch {
      return 'English';
    }
  });

  const setSelectedLanguage = (lang) => {
    setSelectedLanguageState(lang);
    try {
      localStorage.setItem('weathergpt_language', lang);
    } catch (e) {
      console.warn('Failed to persist language in localStorage', e);
    }
  };

  const t = (keyPath, fallback = '') => {
    if (!keyPath) return fallback;
    const keys = keyPath.split('.');
    
    // First try the selected language
    let current = translations[selectedLanguage];
    let found = true;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        found = false;
        break;
      }
    }

    if (found && typeof current === 'string') {
      return current;
    }

    // Fallback to English if missing in selected language
    let englishFallback = translations['English'];
    let engFound = true;
    for (const k of keys) {
      if (englishFallback && typeof englishFallback === 'object' && k in englishFallback) {
        englishFallback = englishFallback[k];
      } else {
        engFound = false;
        break;
      }
    }

    if (engFound && typeof englishFallback === 'string') {
      return englishFallback;
    }

    return fallback || keys[keys.length - 1];
  };

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
