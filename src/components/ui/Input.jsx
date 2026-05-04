import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

const Input = React.forwardRef(
  ({ className = '', type, label, icon: Icon, error, onClear, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Icon size={18} />
            </div>
          )}
          <input
            type={inputType}
            className={`flex h-11 w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
              Icon ? 'pl-10' : ''
            } ${isPassword || onClear ? 'pr-10' : ''} ${error ? 'border-red-500 focus-visible:ring-red-500' : ''} ${className}`}
            ref={ref}
            value={value}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={(e) => {
                e.preventDefault();
                setShowPassword(!showPassword);
              }}
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {onClear && value && !isPassword && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={onClear}
              tabIndex="-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
