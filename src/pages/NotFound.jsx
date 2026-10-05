import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 mx-auto border border-slate-200">
        <HelpCircle className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
        The requested study page does not exist. Navigate back to the home room or curriculum catalog.
      </p>
      <div>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Study Room
        </Link>
      </div>
    </div>
  );
}
