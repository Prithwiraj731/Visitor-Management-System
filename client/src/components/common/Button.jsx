import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const base = 'vms-btn select-none disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'vms-btn-amber',
    secondary: 'vms-btn-line',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    outline: 'bg-transparent border border-white/20 text-white hover:bg-white/10',
    ghost: 'text-white/70 hover:text-white hover:bg-white/[.08]',
    emergency: 'bg-amber-500 text-[#07090F] font-bold animate-pulse',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
