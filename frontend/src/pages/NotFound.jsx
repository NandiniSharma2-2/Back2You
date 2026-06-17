import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ background: '#121214' }}
    >
      {/* Glowing background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00F0FF, transparent)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF007F, transparent)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-md"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="text-[10rem] font-black leading-none select-none"
          style={{
            background: 'linear-gradient(135deg, #00F0FF, #FF007F)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(0,240,255,0.3))',
          }}
        >
          404
        </motion.div>

        {/* Glitch line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3 }}
          className="h-px w-full mb-8"
          style={{ background: 'linear-gradient(90deg, transparent, #00F0FF, #FF007F, transparent)' }}
        />

        <h1 className="text-2xl font-bold text-white mb-3">Signal Lost</h1>
        <p className="text-white/40 text-sm mb-8 leading-relaxed">
          The page you're looking for has gone missing. Maybe it was found by someone else, 
          or it never existed in our network.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #00F0FF, #FF007F)',
              color: '#000',
            }}
          >
            <Home size={16} /> Back Home
          </Link>
          <Link
            to="/search"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-neon-cyan hover:bg-neon-cyan/10"
            style={{ border: '1px solid rgba(0,240,255,0.3)' }}
          >
            <Search size={16} /> Search Items
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-white/20 font-mono tracking-widest"
        >
          BACK2YOU RECOVERY NETWORK
        </motion.div>
      </motion.div>
    </div>
  );
}
