import { useState, useEffect } from 'react'
import { CloudSun, Server, Cpu, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

function App() {
  const [backendStatus, setBackendStatus] = useState({ loading: true, message: null, error: null })

  useEffect(() => {
    // Check backend connection on mount
    fetch('http://127.0.0.1:8000/')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then(data => {
        setBackendStatus({ loading: false, message: data.message, error: null })
      })
      .catch(err => {
        setBackendStatus({ 
          loading: false, 
          message: null, 
          error: 'Could not connect to FastAPI backend on http://127.0.0.1:8000. Start it with `python main.py`.' 
        })
      })
  }, [])

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <CloudSun size={24} />
          </div>
          <h1 className="brand-title gradient-text">WeatherGPT</h1>
        </div>
        <div className="badge">
          <span className="badge-dot"></span>
          Initial Setup Ready
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero">
        <h1 className="hero-title">
          Welcome to <span className="gradient-text">WeatherGPT</span>
        </h1>
        <p className="hero-subtitle">
          Intelligent AI-driven weather insights and forecast engine powered by FastAPI & React + Vite.
        </p>
      </main>

      {/* Service Status Cards */}
      <div className="status-grid">
        {/* Frontend Status */}
        <div className="glass-card status-card">
          <div className="card-header">
            <div className="card-icon">
              <Cpu size={20} />
            </div>
            <h2 className="card-title">Frontend Status</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.5rem', fontWeight: 600 }}>
              <CheckCircle2 size={18} />
              React + Vite Dev Server Active
            </div>
            <p>Running smoothly on local dev server.</p>
          </div>
          <div className="code-block">
            npm run dev
          </div>
        </div>

        {/* Backend Status */}
        <div className="glass-card status-card">
          <div className="card-header">
            <div className="card-icon">
              <Server size={20} />
            </div>
            <h2 className="card-title">FastAPI Backend Status</h2>
          </div>
          <div className="card-body">
            {backendStatus.loading ? (
              <p style={{ color: '#94a3b8' }}>Checking connection to backend...</p>
            ) : backendStatus.error ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <AlertCircle size={18} />
                  Backend Offline
                </div>
                <p style={{ fontSize: '0.85rem' }}>{backendStatus.error}</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <CheckCircle2 size={18} />
                  Connected to Backend
                </div>
                <p style={{ color: '#f8fafc', fontWeight: 500 }}>"{backendStatus.message}"</p>
              </div>
            )}
          </div>
          <div className="code-block">
            python main.py
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>WeatherGPT Scaffold • React (Vite) + FastAPI • Ready for expansion</p>
      </footer>
    </div>
  )
}

export default App
