import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.1)' }}>
          <Icon size={28} className="text-neon-cyan/50" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white/70 mb-2">{title}</h3>
      <p className="text-sm text-white/40 max-w-xs mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link to={action.href} className="btn-primary">{action.label}</Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary">{action.label}</button>
        )
      )}
    </motion.div>
  );
}
