import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Package, FileText, Tag, Settings,
  ScrollText, Menu, X, LogOut, Shield, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/items', label: 'Items', icon: Package },
  { href: '/admin/claims', label: 'Claims', icon: FileText },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: '#121214' }}>
      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 w-64 z-30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#080C18', borderRight: '1px solid rgba(255,0,127,0.1)' }}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6"
          style={{ borderBottom: '1px solid rgba(255,0,127,0.1)' }}>
          <div>
            <div className="text-sm font-black tracking-widest text-neon-pink">ADMIN PANEL</div>
            <div className="text-xs text-white/20 tracking-wider">BACK2YOU</div>
          </div>
          <Shield size={18} className="text-neon-pink/50" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {adminNavItems.map(({ href, label, icon: Icon, exact, adminOnly }) => {
            if (adminOnly && !isAdmin) return null;
            return (
              <NavLink
                key={href}
                to={href}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-neon-pink bg-neon-pink/10 border border-neon-pink/20'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/4 border border-transparent'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,0,127,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #FF007F, #00F0FF)', color: '#000' }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/70 truncate">{user?.first_name}</p>
              <p className="text-xs text-neon-pink/50">{user?.role_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard" className="flex-1 text-center text-xs py-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">
              ← User View
            </Link>
            <button onClick={logout} className="flex items-center gap-1 text-xs py-2 px-3 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={12} /> Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 flex items-center px-6 gap-4 sticky top-0 z-10"
          style={{ background: 'rgba(8,12,24,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,0,127,0.08)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="text-xs font-mono text-neon-pink/30 hidden md:block tracking-widest">
            ADMINISTRATOR CONTROL CENTER
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="page-container py-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
