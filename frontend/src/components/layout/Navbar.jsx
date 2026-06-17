import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Menu, X, User, Settings, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin, isModerator } = useAuth();
  const { unreadCount } = useNotifications() || {};
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: '/search?type=lost', label: 'Lost Items' },
    { href: '/search?type=found', label: 'Found Items' },
    { href: '/#how-it-works', label: 'How It Works' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-xl border-b border-white/5' : ''
      }`}
      style={{ background: scrolled ? 'rgba(10,15,29,0.95)' : 'transparent' }}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-widest neon-text-cyan text-shadow-cyan">
              BACK2YOU
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-white/60 hover:text-neon-cyan transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <Link
              to="/search"
              className="p-2 rounded-lg text-white/40 hover:text-neon-cyan hover:bg-white/5 transition-all"
            >
              <Search size={18} />
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard/notifications"
                  className="relative p-2 rounded-lg text-white/40 hover:text-neon-cyan hover:bg-white/5 transition-all"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{ background: '#FF007F', color: '#fff', fontSize: '9px' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg, #00F0FF, #FF007F)', color: '#000' }}>
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </div>
                    )}
                    <ChevronDown size={14} className="text-white/40" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden"
                        style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                      >
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</p>
                          <p className="text-xs text-white/40">{user?.email}</p>
                          <span className="badge-cyan mt-1 text-xs">{user?.role_name}</span>
                        </div>
                        <div className="py-1">
                          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5">
                            <User size={15} /> Dashboard
                          </Link>
                          <Link to="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5">
                            <Settings size={15} /> Profile Settings
                          </Link>
                          {(isAdmin || isModerator) && (
                            <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-neon-cyan/70 hover:text-neon-cyan hover:bg-neon-cyan/5">
                              <Shield size={15} /> Admin Panel
                            </Link>
                          )}
                          <div className="border-t border-white/5 mt-1 pt-1">
                            <button
                              onClick={logout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/5"
                            >
                              <LogOut size={15} /> Sign Out
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5"
            style={{ background: 'rgba(10,15,29,0.98)', backdropFilter: 'blur(20px)' }}
          >
            <div className="page-container py-4 space-y-2">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href} className="block px-4 py-2.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5">
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="btn-secondary flex-1 text-center text-sm py-2.5">Sign In</Link>
                  <Link to="/register" className="btn-primary flex-1 text-center text-sm py-2.5">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
