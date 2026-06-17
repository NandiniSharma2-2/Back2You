import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`${variants[variant]} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing...
        </>
      ) : children}
    </motion.button>
  );
}
