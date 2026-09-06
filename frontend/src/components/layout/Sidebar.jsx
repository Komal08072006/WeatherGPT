import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  CloudSun,
  Map,
  TriangleAlert,
  Sprout,
  TrendingUp,
  Settings,
  Cloud,
  LogOut,
  Pencil
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import EditProfileModal from './EditProfileModal';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai', label: 'WeatherGPT', icon: Sparkles },
    { id: 'forecast', label: 'Forecast', icon: CloudSun },
    { id: 'map', label: 'Weather Map', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: TriangleAlert },
    { id: 'advisory', label: 'Farmer Advisory', icon: Sprout },
    { id: 'climate', label: 'Climate Analysis', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const displayName = userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
  const displayEmail = userProfile?.email || currentUser?.email || 'Authenticated User';
  const photoURL = userProfile?.photoURL || currentUser?.photoURL;
  const initial = displayName ? displayName[0].toUpperCase() : 'U';

  useEffect(() => {
    setImgError(false);
  }, [photoURL]);

  return (
    <>
      <aside className="hidden md:flex flex-col w-52 lg:w-56 bg-white border-r border-slate-200/80 min-h-screen sticky top-0 h-screen z-30 select-none">
        {/* Brand Header */}
        <div 
          onClick={() => navigate('/')}
          className="p-4 flex items-center gap-2.5 border-b border-slate-100 cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/30">
            <Cloud className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">
            Weather<span className="text-sky-600">GPT</span>
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 font-medium cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 stroke-[2.2]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Footer Section */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Sign Out</span>
            </div>
          </button>

          {/* User Profile Area (Clickable to Edit Profile) */}
          <div 
            onClick={() => setIsEditProfileOpen(true)}
            title="Click to Edit Profile"
            className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs hover:border-sky-300 hover:bg-sky-50/60 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-bold text-xs text-sky-700 overflow-hidden shrink-0 relative">
              {photoURL && !imgError ? (
                <img 
                  src={photoURL} 
                  alt={displayName} 
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-sky-700 transition-colors">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
            </div>
            <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" />
          </div>
        </div>
      </aside>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
      />
    </>
  );
}

