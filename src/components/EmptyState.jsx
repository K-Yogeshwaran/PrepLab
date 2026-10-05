import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowRight } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data available',
  description = 'There are no records to display at this time.',
  actionText,
  actionLink,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>

      {actionLink && actionText && (
        <Link
          to={actionLink}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
        >
          {actionText}
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Link>
      )}

      {!actionLink && onAction && actionText && (
        <button
          onClick={onAction}
          type="button"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
        >
          {actionText}
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </button>
      )}
    </div>
  );
}
