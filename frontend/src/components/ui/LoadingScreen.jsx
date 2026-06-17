import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#121214' }}>
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div className="text-4xl font-black tracking-widest neon-text-cyan text-shadow-cyan">
            BACK2YOU
          </div>
          <div className="text-xs text-neon-cyan/50 tracking-[0.4em] mt-1">INITIALIZING NETWORK</div>
        </motion.div>

        <div className="relative w-48 h-1 mx-auto bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, #00F0FF, #FF007F)' }}
            animate={{ x: [-192, 192] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
}
