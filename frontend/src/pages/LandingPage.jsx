import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function SceneSection({ children, progressRange }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Fade in, move up, hold, fade out
  const opacity = useTransform(
    scrollYProgress,
    progressRange.opacityInput,
    progressRange.opacityOutput
  );

  const y = useTransform(
    scrollYProgress,
    progressRange.yInput,
    progressRange.yOutput
  );

  const scale = useTransform(
    scrollYProgress,
    progressRange.scaleInput || [0.2, 0.45, 0.55, 0.8],
    progressRange.scaleOutput || [0.95, 1, 1, 1.02]
  );

  return (
    <section 
      ref={containerRef} 
      className="h-[120vh] flex items-center justify-center relative px-6 text-center"
    >
      <motion.div 
        style={{ opacity, y, scale }}
        className="max-w-4xl mx-auto z-10 flex flex-col items-center justify-center"
      >
        {children}
      </motion.div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = React.useState('/bg-video.mp4');

  const handleAuthAction = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn("Video play trigger:", err);
      });
    }
  }, [videoSrc]);

  const handleVideoError = () => {
    console.warn("Local video failed to load, switching to fallback stream...");
    if (videoSrc === '/bg-video.mp4') {
      setVideoSrc('https://cdn.coverr.co/videos/coverr-clouds-flying-by-4752/1080p.mp4');
    }
  };

  // Animation config presets for scroll progress
  const standardRange = {
    opacityInput: [0.15, 0.38, 0.62, 0.85],
    opacityOutput: [0, 1, 1, 0],
    yInput: [0.15, 0.38, 0.62, 0.85],
    yOutput: [40, 0, 0, -40]
  };

  const heroRange = {
    opacityInput: [0, 0.25, 0.5, 0.75],
    opacityOutput: [1, 1, 1, 0],
    yInput: [0, 0.25, 0.5, 0.75],
    yOutput: [0, 0, 0, -50]
  };

  const finalRange = {
    opacityInput: [0.2, 0.5, 0.9, 1],
    opacityOutput: [0, 1, 1, 1],
    yInput: [0.2, 0.5, 0.9, 1],
    yOutput: [50, 0, 0, 0]
  };

  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Base Dark Background Layer (Behind Video) */}
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
          className="w-full h-full object-cover scale-105 filter brightness-95 contrast-105"
        />
      </div>

      {/* Ambient Gradient & Fog Overlay Layer (Above Video, Behind Text) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/80 backdrop-blur-[1px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/15 to-indigo-600/0 rounded-full blur-[140px]" />
      </div>

      {/* Floating Header Brand Badge */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-12 py-6 flex items-center justify-between backdrop-blur-md bg-slate-950/30 border-b border-white/5">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-300">
            WeatherGPT
          </span>
        </div>

        <button
          onClick={handleAuthAction}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-medium text-white transition-all duration-300 backdrop-blur-md hover:scale-105 active:scale-95 shadow-lg shadow-black/20 cursor-pointer"
        >
          {currentUser ? 'Go to Dashboard' : 'Sign In'}
        </button>
      </header>

      {/* Main Continuous Scroll Storytelling */}
      <main className="relative z-10 pt-16">
        {/* Scene 1 */}
        <SceneSection progressRange={heroRange}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold tracking-wider uppercase mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> Next Generation Atmospheric AI
          </div>
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-2xl mb-6">
            WeatherGPT
          </h1>
          <p className="text-2xl sm:text-3xl md:text-4xl font-light text-cyan-200/90 tracking-wide font-sans">
            Weather, but smarter.
          </p>

          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center text-slate-400/80 text-xs tracking-widest uppercase gap-2 animate-bounce pointer-events-none">
            <span>Scroll to explore</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </SceneSection>

        {/* Scene 2 */}
        <SceneSection progressRange={standardRange}>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-100 leading-tight">
            Weather isn't just a forecast.
          </h2>
        </SceneSection>

        {/* Scene 3 */}
        <SceneSection progressRange={standardRange}>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-cyan-200 leading-tight">
            It's about knowing what's coming.
          </h2>
        </SceneSection>

        {/* Scene 4 */}
        <SceneSection progressRange={standardRange}>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Ask questions.
          </h2>
          <p className="text-3xl sm:text-5xl md:text-6xl font-light text-cyan-300/90 tracking-wide">
            Get intelligent answers.
          </p>
        </SceneSection>

        {/* Scene 5 */}
        <SceneSection progressRange={standardRange}>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 leading-tight">
            Forecasts. Alerts. Weather intelligence.
          </h2>
        </SceneSection>

        {/* Scene 6 */}
        <SceneSection progressRange={standardRange}>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Your weather. Your questions. <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">One AI.</span>
          </h2>
        </SceneSection>

        {/* Final Scene */}
        <SceneSection progressRange={finalRange}>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight mb-10">
            Ready to experience WeatherGPT?
          </h2>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 35px rgba(6, 182, 212, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAuthAction}
            className="group relative inline-flex items-center gap-4 px-10 py-5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xl font-bold tracking-wide shadow-2xl shadow-cyan-500/30 transition-all duration-300 overflow-hidden cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-3">
              GET STARTED
              <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.button>
        </SceneSection>
      </main>

      {/* Simple Clean Footer */}
      <footer className="relative z-10 py-8 px-6 text-center text-slate-500 text-sm border-t border-white/5 bg-slate-950/60 backdrop-blur-md">
        © {new Date().getFullYear()} WeatherGPT Inc. All rights reserved.
      </footer>
    </div>
  );
}
