import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MapPin, LayoutGrid, Settings, LogOut, User, LogIn, ChevronDown, Clock, Upload, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';
import UserSettings from './UserSettings';
import { useUploadContext } from '../contexts/UploadContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { hasActiveUploads, totalCount, completedCount } = useUploadContext();
  const { t } = useTranslation(['common', 'account']);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const isActive = (path: string) => {
    if (path === '/events') {
      return location.pathname === '/events' || location.pathname.startsWith('/events/') || location.pathname.startsWith('/p/');
    }
    // /search redirects to /timeline (they were merged into one combined browse+search page —
    // see Timeline.tsx), but keep the nav highlighted correctly for anyone still mid-redirect.
    if (path === '/timeline') {
      return location.pathname === '/timeline' || location.pathname === '/search';
    }
    return location.pathname === path;
  };
  
  const linkClass = (path: string) => {
    const base = "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium";
    return isActive(path) 
      ? `${base} bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300`
      : `${base} text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`;
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    
    // Show confirmation for mobile users
    if (Capacitor.isNativePlatform()) {
      const confirmed = window.confirm(t('account:auth.logoutConfirm'));
      if (!confirmed) return;
    }
    
    logout();
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
            <span className="font-bold text-lg hidden sm:inline">{config.brandName}</span>
            <span className="font-bold text-lg sm:hidden">{config.brandName.split(' ').map(w => w[0]).join('')}</span>
          </Link>
          
          {/* Upload activity indicator */}
          {hasActiveUploads && totalCount > 0 && (
            <div className="flex items-center gap-1.5 ml-2 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
              <Upload className="w-3 h-3 animate-pulse" />
              <span>{completedCount}/{totalCount}</span>
            </div>
          )}
          
          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/events" className={linkClass('/events')}>
              <LayoutGrid className="w-4 h-4 sm:mr-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t('navigation.events')}</span>
              <span className="sr-only sm:hidden">{t('navigation.events')}</span>
            </Link>
            
            <Link to="/favorites" className={linkClass('/favorites')}>
              <Heart className="w-4 h-4 sm:mr-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t('navigation.favorites')}</span>
              <span className="sr-only sm:hidden">{t('navigation.favorites')}</span>
            </Link>
            
            <Link to="/map" className={linkClass('/map')}>
              <MapPin className="w-4 h-4 sm:mr-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t('navigation.map')}</span>
              <span className="sr-only sm:hidden">{t('navigation.map')}</span>
            </Link>
            
            <Link to="/timeline" className={linkClass('/timeline')}>
              <Clock className="w-4 h-4 sm:mr-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t('navigation.timeline')}</span>
              <span className="sr-only sm:hidden">{t('navigation.timeline')}</span>
            </Link>
            
            {/* User Menu */}
            <div className="relative ml-2" ref={menuRef}>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={t('navigation.userMenu')}
                  >
                    <User className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden lg:inline max-w-[150px] truncate">
                      {user?.name || user?.email}
                    </span>
                    <ChevronDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email}
                        </p>
                        {user?.favorites_count !== undefined && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('account:profile.favoritesCount', { count: user.favorites_count })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowSettings(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        {t('navigation.settings')}
                      </button>
                      <LanguageSwitcher variant="menu" onLanguageChanged={() => setShowUserMenu(false)} />
                      {user?.isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {t('navigation.adminDashboard')}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('navigation.logout')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label={t('navigation.login')}
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t('navigation.login')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* User Settings Modal */}
      <UserSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </nav>
  );
};

export default Navbar;
