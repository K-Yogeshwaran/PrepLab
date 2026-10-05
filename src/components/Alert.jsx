import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const VARIANTS = {
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: AlertCircle,
    iconColor: 'text-rose-600',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: CheckCircle,
    iconColor: 'text-emerald-600',
  },
  info: {
    container: 'bg-slate-50 border-slate-200 text-slate-800',
    icon: Info,
    iconColor: 'text-slate-600',
  },
};

export default function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) {
  const currentVariant = VARIANTS[variant] || VARIANTS.info;
  const Icon = currentVariant.icon;

  return (
    <div
      className={`border rounded-xl p-3.5 flex items-start space-x-3 text-xs ${currentVariant.container} ${className}`}
      role="alert"
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${currentVariant.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold mb-0.5 text-xs">{title}</h4>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
