import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Camera, Upload, Link as LinkIcon, Check, AlertCircle, Loader2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { validatePhoneNumber, formatPhoneNumber } from '../../utils/phoneUtils';

export default function EditProfileModal({ isOpen, onClose }) {
  const { currentUser, userProfile, updateUserProfileData } = useAuth();
  const { t } = useLanguage();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [avatarMode, setAvatarMode] = useState('url'); // 'url' | 'file'
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentName = userProfile?.name || currentUser?.displayName || '';
      const currentEmail = userProfile?.email || currentUser?.email || '';
      const currentPhone = userProfile?.phoneNumber || '';
      const currentPhoto = userProfile?.photoURL || currentUser?.photoURL || '';

      setDisplayName(currentName);
      setEmail(currentEmail);
      setPhoneNumber(currentPhone);
      setPhotoURL(currentPhoto);
      setError(null);
      setSuccess(false);
      setPreviewError(false);
    }
  }, [isOpen, userProfile, currentUser]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Image size exceeds 3MB limit. Please choose a smaller file.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoURL(event.target.result);
        setPreviewError(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    // Phone validation & normalization if phone is provided
    const cleanPhone = phoneNumber.trim();
    let formattedPhone = null;

    if (cleanPhone) {
      const validation = validatePhoneNumber(cleanPhone);
      if (!validation.isValid) {
        setError(validation.error || 'Please enter a valid phone number.');
        return;
      }

      formattedPhone = formatPhoneNumber(cleanPhone);
      if (!formattedPhone) {
        setError('Please enter a valid phone number (e.g., +919876543210 or 9876543210).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Determine smsAlertsEnabled: default true if adding phone for first time, else maintain current setting
      const existingAlertSetting = userProfile?.smsAlertsEnabled;
      const enableSmsAlerts = formattedPhone ? (existingAlertSetting !== undefined ? existingAlertSetting : true) : false;

      await updateUserProfileData({
        name: displayName.trim(),
        photoURL: photoURL.trim() ? photoURL.trim() : null,
        phoneNumber: formattedPhone,
        smsAlertsEnabled: enableSmsAlerts
      });

      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  const initial = displayName.trim() ? displayName.trim()[0].toUpperCase() : (email ? email[0].toUpperCase() : 'U');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{t('profile.title')}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Status Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl text-xs font-medium text-red-600 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('profile.saved')}</span>
            </div>
          )}

          {/* Avatar Preview & Source Options */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-sky-950/50 border-2 border-sky-300 dark:border-sky-700 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-2xl overflow-hidden shadow-md relative">
                {photoURL && !previewError ? (
                  <img
                    src={photoURL}
                    alt={displayName || 'Profile preview'}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400">
                <Camera className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              </div>
            </div>

            {/* Avatar Input Mode Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAvatarMode('url')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  avatarMode === 'url'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarMode('file')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  avatarMode === 'file'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>
          </div>

          {/* Avatar Input Fields */}
          {avatarMode === 'url' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Profile Picture URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => {
                    setPhotoURL(e.target.value);
                    setPreviewError(false);
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Paste a direct link to an online image (JPG, PNG, WebP).</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 dark:file:bg-sky-950/60 file:text-sky-700 dark:file:text-sky-300 hover:file:bg-sky-100 dark:hover:file:bg-sky-900/60 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Select an image file from your computer (max 3MB).</p>
            </div>
          )}

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded">
                SMS Alerts
              </span>
            </div>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="+919876543210 or 9876543210"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-9 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Used to receive severe weather alerts via SMS (e.g. +919876543210 or 9876543210).
            </p>
          </div>

          {/* Email Address Input (Read-only) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Read-only</span>
            </div>
            <div className="relative">
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>Email changes require provider re-verification. Contact support to update your email.</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-sm shadow-sky-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

