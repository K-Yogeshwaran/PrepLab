import React, { useState } from 'react';
import { AlertCircle, X, ExternalLink, Check, Copy } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function SupabaseStatusBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const configured = isSupabaseConfigured();

  if (configured || dismissed) {
    return null;
  }

  const copyEnvHint = () => {
    navigator.clipboard?.writeText(
      'VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key'
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Local Storage Mode Active:</span> Supabase environment variables are currently unset or placeholders in <code className="bg-amber-100 px-1 py-0.5 rounded text-xs font-mono">.env.local</code>. Practice tests will save locally in your browser storage.
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
          <button
            onClick={copyEnvHint}
            type="button"
            className="inline-flex items-center text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Copied .env keys
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy .env keys
              </>
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 text-amber-600 hover:text-amber-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
