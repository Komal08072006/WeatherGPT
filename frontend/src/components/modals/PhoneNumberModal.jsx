import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validatePhoneNumber, formatPhoneNumber } from '../../utils/phoneUtils';

export default function PhoneNumberModal() {
  const { currentUser, userProfile, updateUserPhoneNumber } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check if user is logged in, profile exists, has no phone number, and hasn't dismissed popup in this session
    if (currentUser && userProfile !== null) {
      const isDismissed = sessionStorage.getItem('weathergpt_phone_modal_dismissed') === 'true';
      if (!userProfile.phoneNumber && !isDismissed) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
  }, [currentUser, userProfile]);

  if (!isOpen) return null;

  const handleMaybeLater = () => {
    sessionStorage.setItem('weathergpt_phone_modal_dismissed', 'true');
    setIsOpen(false);
  };

  const handleSaveNumber = async (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = phoneNumber.trim();
    const validation = validatePhoneNumber(cleanInput);
    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid phone number.');
      return;
    }

    const formatted = formatPhoneNumber(cleanInput);
    if (!formatted) {
      setError('Please enter a valid phone number.');
      return;
    }

    setSaving(true);
    try {
      // Save phone number and automatically enable SMS alerts by default when phone is added
      await updateUserPhoneNumber(formatted, true);
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to save phone number:', err);
      setError('Failed to save phone number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-7 relative font-sans overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-xs animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Phone Number Added</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                ✅ Phone number added successfully.<br />You'll now receive WeatherGPT alerts on your phone.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Title / Icon */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/60 rounded-2xl flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400 shadow-2xs">
                <span className="text-2xl">📱</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                📱 Stay Updated!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                Add your phone number to receive important weather alerts directly on your phone.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNumber} className="space-y-4 pt-1">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="+919876543210 or 9876543210"
                    disabled={saving}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 pt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Number</span>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleMaybeLater}
                    disabled={saving}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
