import React, { useState, useEffect } from 'react';
import { Settings, MapPin, Bell, Globe, Sun, Moon, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { validatePhoneNumber, formatPhoneNumber, maskPhoneNumber } from '../utils/phoneUtils';

export default function SettingsPage({
  currentLocation,
  theme = 'light',
  onThemeChange
}) {
  const { selectedLanguage, setSelectedLanguage, t } = useLanguage();
  const { userProfile, updateUserPhoneNumber } = useAuth();

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [inputPhone, setInputPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const hasPhone = Boolean(userProfile?.phoneNumber);
  const smsAlertsEnabled = Boolean(userProfile?.smsAlertsEnabled);

  useEffect(() => {
    if (userProfile?.phoneNumber) {
      setInputPhone(userProfile.phoneNumber);
    }
  }, [userProfile?.phoneNumber]);

  const handleStartEdit = () => {
    setInputPhone(userProfile?.phoneNumber || '');
    setPhoneError('');
    setSuccessMessage('');
    setIsEditingPhone(true);
  };

  const handleCancelEdit = () => {
    setIsEditingPhone(false);
    setPhoneError('');
    setInputPhone(userProfile?.phoneNumber || '');
  };

  const handleSavePhone = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setSuccessMessage('');

    const cleanInput = inputPhone.trim();
    const validation = validatePhoneNumber(cleanInput);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Please enter a valid phone number.');
      return;
    }

    const formatted = formatPhoneNumber(cleanInput);
    if (!formatted) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }

    setSaving(true);
    try {
      const isNewNumber = !hasPhone;
      // If first time adding phone, enable SMS alerts by default. If updating, keep current SMS setting.
      const enableSms = isNewNumber ? true : smsAlertsEnabled;
      await updateUserPhoneNumber(formatted, enableSms);

      setIsEditingPhone(false);
      if (isNewNumber) {
        setSuccessMessage("✅ Phone number added successfully. You'll now receive WeatherGPT alerts on your phone.");
      } else {
        setSuccessMessage('✅ Phone number updated successfully.');
      }

      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error saving phone number:', err);
      setPhoneError('Failed to save phone number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSmsAlerts = async () => {
    if (!hasPhone || saving) return;
    const newStatus = !smsAlertsEnabled;
    setSaving(true);
    try {
      await updateUserPhoneNumber(userProfile.phoneNumber, newStatus);
    } catch (err) {
      console.error('Error toggling SMS alerts:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold shadow-2xs">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('settings.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
        {/* Primary Location */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Primary Observation Location</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{currentLocation?.name || 'Lucknow, Uttar Pradesh'}</div>
            </div>
          </div>
        </div>

        {/* Alert Triggers */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('settings.notifications')}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.notificationsDesc')}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60">
            {t('common.active')}
          </span>
        </div>

        {/* 📱 Weather Alert Notifications & Phone Number Section */}
        <div className="pb-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                📱 Weather Alert Notifications
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Receive WeatherGPT weather alerts directly on your phone.
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Phone Number Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Phone Number
                </div>
                {!isEditingPhone && (
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {hasPhone ? maskPhoneNumber(userProfile.phoneNumber) : 'No phone number added.'}
                  </div>
                )}
              </div>

              {!isEditingPhone && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {hasPhone ? 'Change Number' : 'Add Phone Number'}
                </button>
              )}
            </div>

            {/* Editing State Form */}
            {isEditingPhone && (
              <form onSubmit={handleSavePhone} className="space-y-3 pt-1">
                <div className="relative flex items-center">
                  <input
                    type="tel"
                    value={inputPhone}
                    onChange={(e) => {
                      setInputPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="+919876543210 or 9876543210"
                    disabled={saving}
                    className="w-full pl-3 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>

                {phoneError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Number</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* SMS Weather Alerts Toggle Row */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  SMS Weather Alerts
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {hasPhone
                    ? 'Receive weather alerts on your phone.'
                    : 'Add a phone number to receive alerts by SMS.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleSmsAlerts}
                disabled={!hasPhone || saving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  smsAlertsEnabled && hasPhone
                    ? 'bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-700 opacity-60 cursor-not-allowed'
                } ${!hasPhone ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    smsAlertsEnabled && hasPhone ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Language Preference (Synced with Header & App state) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('settings.languagePref')}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.languageDesc')}
              </div>
            </div>
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="English">English (ENG)</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Bengali">বাংলা (Bengali)</option>
            <option value="Tamil">தமிழ் (Tamil)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>
        </div>

        {/* Appearance / Theme Toggle (Global Light / Dark Mode) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('settings.appearance')}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.appearanceDesc')}
              </div>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('light')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('settings.lightMode')}</span>
            </button>
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('dark')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 dark:bg-slate-900 text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('settings.darkMode')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
