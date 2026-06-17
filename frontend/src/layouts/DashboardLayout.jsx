import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: '#121214' }}>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div className={`fixed lg:hidden z-30 top-0 left-0 h-full transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar collapsed={false} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-16 flex items-center px-6 gap-4 sticky top-0 z-10"
          style={{ background: 'rgba(18,18,20,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
          >
            <Menu size={20} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            <Menu size={18} />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex-1" />
          <div className="text-xs font-mono text-neon-cyan/30 hidden md:block">
            BACK2YOU NETWORK ● SECURE CONNECTION
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="page-container py-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
