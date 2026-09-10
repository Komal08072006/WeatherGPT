import React, { useState, useEffect } from 'react';
import WeatherAlert from '../components/alerts/WeatherAlert';
import { TriangleAlert, ShieldCheck, CheckCircle2, Share2, FileText, Loader2, Smartphone } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function AlertsPage({ mockWeatherAlert, currentLocation }) {
  const { t, formatNumber } = useLanguage();
  const { userProfile } = useAuth();
  const [alertState, setAlertState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState(null);

  const searchLocation = currentLocation?.searchName || (currentLocation?.name ? currentLocation.name.split(',')[0].trim() : 'Lucknow');
  const displayLocation = currentLocation?.name || 'Lucknow';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const alertUrl = (currentLocation?.latitude != null && currentLocation?.longitude != null)
      ? `${API_BASE_URL}/alerts?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}`
      : `${API_BASE_URL}/alerts?location=${encodeURIComponent(searchLocation)}`;

    fetch(alertUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load alerts for ${displayLocation}`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setAlertState(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error loading alert data');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchLocation, displayLocation, currentLocation?.latitude, currentLocation?.longitude]);

  const handleSendSMS = async () => {
    setSmsStatus(null);

    if (!userProfile?.phoneNumber) {
      setSmsStatus({
        type: 'error',
        message: 'No phone number found in profile. Please add your phone number in Settings.'
      });
      return;
    }

    const hasAlert = Boolean(alertState?.has_alert);
    const locName = alertState?.full_location || alertState?.location || displayLocation;

    let messageText = '';
    if (hasAlert) {
      messageText = `⚠️ WeatherGPT Alert: ${alertState.title}\nLocation: ${locName}\nSeverity: ${alertState.severity}\nExpected Window: ${alertState.expected_window}\nPrecipitation: ${alertState.precipitation_expected_mm} mm\nSource: ${alertState.source || 'Open-Meteo'}`;
    } else {
      const precip = alertState?.precipitation_expected_mm ?? 0;
      messageText = `✅ WeatherGPT: No Active Weather Alerts\nLocation: ${locName}\nStatus: All Clear (Precipitation: ${precip} mm, below warning threshold)\nSource: ${alertState?.source || 'Open-Meteo'}`;
    }

    setSendingSms(true);
    try {
      const res = await fetch(`${API_BASE_URL}/send-alert-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: userProfile.phoneNumber,
          message: messageText,
          location: locName,
          is_alert: hasAlert,
          title: alertState?.title,
          severity: alertState?.severity,
          expected_window: alertState?.expected_window,
          precipitation_expected_mm: alertState?.precipitation_expected_mm
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Failed to send SMS');
      }

      if (data.status === 'simulated') {
        setSmsStatus({
          type: 'success',
          message: `Simulated SMS sent to ${userProfile.phoneNumber} (Twilio keys missing)`
        });
      } else {
        setSmsStatus({
          type: 'success',
          message: `SMS sent successfully to ${userProfile.phoneNumber}!`
        });
      }
    } catch (err) {
      console.error('Failed to send SMS:', err);
      setSmsStatus({
        type: 'error',
        message: err.message || 'Failed to send SMS notification.'
      });
    } finally {
      setSendingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shadow-2xs">
          <TriangleAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('alerts.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('alerts.subtitle')} — <span className="font-semibold text-slate-700 dark:text-slate-200">{displayLocation}</span>.
          </p>
        </div>
      </div>

      {/* SMS Status Feedback Banner */}
      {smsStatus && (
        <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between gap-2 shadow-xs transition-all ${
          smsStatus.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-200 dark:border-red-800'
        }`}>
          <span>{smsStatus.message}</span>
          <button onClick={() => setSmsStatus(null)} className="text-xs font-bold opacity-60 hover:opacity-100 px-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 className="w-6 h-6 text-sky-600 dark:text-sky-400 animate-spin" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('common.loading')}</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl p-4 text-xs font-medium shadow-xs">
          {error}
        </div>
      ) : alertState && alertState.has_alert ? (
        <WeatherAlert
          alertData={{
            title: alertState.title,
            badge: `${alertState.severity} Alert • ${alertState.source}`,
            expectedWindow: formatNumber(alertState.expected_window),
            affectedTract: alertState.full_location || alertState.location,
            diagnostic: `Expected max daily precipitation: ${formatNumber(alertState.precipitation_expected_mm)} mm (Peak probability: ${formatNumber(alertState.precipitation_probability)}%).`
          }}
          onShare={() => alert('Alert details copied to clipboard')}
          onViewAdvisory={() => alert(`View advisory for ${alertState.location}`)}
          onSendSMS={handleSendSMS}
          sendingSms={sendingSms}
        />
      ) : (
        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100 tracking-tight">
                {t('alerts.noActiveAlerts')}
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-2xs">
              ALL CLEAR
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-200 space-y-2 mb-4">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t('alerts.noActiveAlerts')} ({alertState?.full_location || displayLocation}).</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
              Expected daily precipitation is {formatNumber(alertState?.precipitation_expected_mm || 0)} mm, which is below severe weather warning thresholds.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 text-xs flex-wrap">
            <button
              onClick={handleSendSMS}
              disabled={sendingSms}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {sendingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>{sendingSms ? 'Sending SMS...' : 'Send SMS Confirmation'}</span>
            </button>
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold cursor-not-allowed text-xs opacity-70"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Alert</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


