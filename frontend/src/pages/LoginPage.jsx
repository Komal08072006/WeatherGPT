import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, User, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, loginWithEmail, signupWithEmail, loginWithGoogle, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState('/bg-video.mp4');

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  // If user is already authenticated, redirect immediately to dashboard
  if (!authLoading && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleVideoError = () => {
    if (videoSrc === '/bg-video.mp4') {
      setVideoSrc('https://cdn.coverr.co/videos/coverr-clouds-flying-by-4752/1080p.mp4');
    }
  };

  const getFriendlyErrorMessage = (error) => {
    if (!error) return 'An error occurred. Please try again.';
    const code = error.code || error.message || '';
    if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (code.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Try logging in instead.';
    }
    if (code.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    if (code.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in popup was closed before completing.';
    }
    return error.message || 'Authentication failed. Please try again.';
  };

  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }
    if (isSignUp) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signupWithEmail(name.trim(), email.trim(), password);
        setSuccessMessage('Account created successfully! Redirecting...');
      } else {
        await loginWithEmail(email.trim(), password);
        setSuccessMessage('Authentication successful! Redirecting...');
      }

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 600);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(getFriendlyErrorMessage(err));
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      setSuccessMessage('Signed in with Google! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 600);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(getFriendlyErrorMessage(err));
    }
  };

  const handleFillDemo = () => {
    setName('Komal Yadav');
    setEmail('komal.yadav@weathergpt.ai');
    setPassword('weathergpt2026');
    setConfirmPassword('weathergpt2026');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* Base Dark Background Layer */}
      <div className="fixed inset-0 bg-slate-950 -z-30 pointer-events-none" />

      {/* Fixed Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          key={videoSrc}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => videoRef.current && videoRef.current.play().catch(() => {})}
          onError={handleVideoError}
          className="w-full h-full object-cover scale-105 filter brightness-[0.4] contrast-110"
        />
      </div>

      {/* Ambient Gradient & Fog Overlay Layer */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/80 backdrop-blur-[2px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[300px] bg-blue-600/15 rounded-full blur-[130px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900/80 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/90 relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div 
            onClick={() => navigate('/')}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/25 mb-4 cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-200">
            WeatherGPT
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-light">
            {isSignUp ? t('auth.signupSubtitle') : t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Error Alert Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 20 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-medium flex items-center gap-2 overflow-hidden"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-ping" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Success Toast */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 px-4 py-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('auth.nameLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Komal Yadav"
                  required={isSignUp}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t('auth.emailLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t('auth.confirmPasswordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required={isSignUp}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/70 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            type="submit"
            disabled={isSubmitting || authLoading || !!successMessage}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? t('auth.signUpBtn') : t('auth.signInBtn')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Demo Fill Option */}
        <div className="mt-4 pt-2 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" /> {t('auth.fillDemo')}
          </button>
        </div>

        {/* Social Authentication Options */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-3">
            {t('auth.orContinueWith')}
          </p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-100 flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            {t('auth.continueWithGoogle')}
          </button>
        </div>

        {/* Toggle between Sign In and Sign Up */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
          {isSignUp ? (
            <p>
              {t('auth.alreadyAccount')}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
              >
                {t('auth.signInBtn')}
              </button>
            </p>
          ) : (
            <p>
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
              >
                {t('auth.signUpBtn')}
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
