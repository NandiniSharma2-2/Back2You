import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Search, MapPin, Package, FileText, MessageSquare,
  Bell, User, LogOut, ChevronRight, PlusCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const navItems = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/lost', label: 'Lost Items', icon: MapPin },
  { href: '/dashboard/found', label: 'Found Items', icon: Package },
  { href: '/dashboard/claims', label: 'My Claims', icon: FileText },
  { href: '/dashboard/chat', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ collapsed }) {
  const { user, logout, isAdmin, isModerator } = useAuth();
  const { unreadCount } = useNotifications() || {};
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{
        background: '#0A0F1D',
        borderRight: '1px solid rgba(0,240,255,0.08)',
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4" style={{ borderBottom: '1px solid rgba(0,240,255,0.08)' }}>
        {!collapsed ? (
          <span className="text-lg font-black tracking-widest neon-text-cyan">BACK2YOU</span>
        ) : (
          <span className="text-lg font-black neon-text-cyan mx-auto">B2</span>
        )}
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-xs text-white/20 font-medium tracking-widest mb-3">QUICK ACTIONS</p>
          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to="/dashboard/lost/create"
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(0,240,255,0.1)' : 'rgba(0,240,255,0.04)',
                border: '1px solid rgba(0,240,255,0.1)',
                color: '#00F0FF',
              })}
            >
              <PlusCircle size={16} />
              Lost
            </NavLink>
            <NavLink
              to="/dashboard/found/create"
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(255,0,127,0.1)' : 'rgba(255,0,127,0.04)',
                border: '1px solid rgba(255,0,127,0.1)',
                color: '#FF007F',
              })}
            >
              <PlusCircle size={16} />
              Found
            </NavLink>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {!collapsed && (
          <p className="text-xs text-white/20 font-medium tracking-widest px-2 mb-3">NAVIGATION</p>
        )}
        <div className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <NavLink
              key={href}
              to={href}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group ${
                  isActive
                    ? 'text-neon-cyan'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/3'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'rgba(0,240,255,0.08)',
                border: '1px solid rgba(0,240,255,0.15)',
              } : { border: '1px solid transparent' }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
                      style={{ background: '#00F0FF' }}
                    />
                  )}
                  <Icon size={16} className={isActive ? 'text-neon-cyan' : ''} />
                  {!collapsed && (
                    <span className="text-sm font-medium flex-1">{label}</span>
                  )}
                  {!collapsed && label === 'Notifications' && unreadCount > 0 && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#FF007F', color: '#fff', minWidth: '20px', textAlign: 'center' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {(isAdmin || isModerator) && (
            <>
              <div className="my-3 mx-2 border-t border-white/5" />
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive ? 'text-neon-cyan' : 'text-neon-cyan/40 hover:text-neon-cyan/70 hover:bg-neon-cyan/5'
                  }`
                }
              >
                <ChevronRight size={16} />
                {!collapsed && <span className="text-sm font-medium">Admin Panel</span>}
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* User Profile Footer */}
      {!collapsed && (
        <div className="p-4" style={{ borderTop: '1px solid rgba(0,240,255,0.08)' }}>
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00F0FF, #FF007F)', color: '#000' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-white/30 truncate">{user?.role_name}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
