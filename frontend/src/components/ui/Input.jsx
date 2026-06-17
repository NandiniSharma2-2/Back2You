import React from 'react';

const Input = React.forwardRef(function Input({
  label,
  error,
  hint,
  icon: Icon,
  rightElement,
  className = '',
  ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={`input-field ${Icon ? 'pl-10' : ''} ${rightElement ? 'pr-12' : ''} ${error ? 'border-red-500/50 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
});

export default Input;

export const Textarea = React.forwardRef(function Textarea({ label, error, hint, className = '', rows = 4, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-white/70">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`input-field resize-none ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
});

export const Select = React.forwardRef(function Select({ label, error, options = [], placeholder, className = '', ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-white/70">{label}</label>
      )}
      <select
        ref={ref}
        className={`input-field ${error ? 'border-red-500/50' : ''} ${className}`}
        style={{ color: props.value ? '#e2e8f0' : 'rgba(226,232,240,0.4)' }}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: '#0A0F1D', color: '#e2e8f0' }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});
