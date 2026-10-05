import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowRight } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no records to display at this time.',
  actionText,
  actionLink,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-lg border border-slate-200 shadow-xs">
      <div className="w-11 h-11 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 mb-3 border border-slate-200">
        <Icon className="w-5 h-5" />
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>

      {actionLink && actionText && (
        <Link
          to={actionLink}
          className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-slate-800 transition-colors shadow-xs"
        >
          {actionText}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Link>
      )}

      {!actionLink && onAction && actionText && (
        <button
          onClick={onAction}
          type="button"
          className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          {actionText}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </button>
      )}
    </div>
  );
}
