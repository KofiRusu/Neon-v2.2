'use client';

import { useState } from 'react';
import { DatabaseZap, X } from 'lucide-react';

export function QAToolsWidget() {
  const [open, setOpen] = useState(false);
  
  // Mock mutations for testing
  const seedMutation = {
    mutate: () => {
      console.log('Seed test data clicked');
    },
    isLoading: false
  };
  
  const clearMutation = {
    mutate: () => {
      console.log('Clear test data clicked');
    },
    isLoading: false
  };
  
  const debugMutation = {
    mutate: () => {
      console.log('Debug mode toggled');
    },
    isLoading: false
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        className="bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-amber-600"
        onClick={() => setOpen(!open)}
      >
        QA Tools
      </button>
      {open && (
        <div className="mt-2 bg-white border rounded shadow-xl p-4 w-64 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm">QA Utilities</span>
            <button onClick={() => setOpen(false)} aria-label="Close QA panel">
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => seedMutation.mutate()}
            className="w-full flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded"
            disabled={seedMutation.isLoading}
          >
            <DatabaseZap className="w-4 h-4" />
            <span>Seed Test Data</span>
          </button>
          <button
            onClick={() => clearMutation.mutate()}
            className="w-full flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded"
            disabled={clearMutation.isLoading}
          >
            <DatabaseZap className="w-4 h-4" />
            <span>Clear Test Data</span>
          </button>
          <button
            onClick={() => debugMutation.mutate()}
            className="w-full flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded"
            disabled={debugMutation.isLoading}
          >
            <DatabaseZap className="w-4 h-4" />
            <span>Toggle Debug Mode</span>
          </button>
        </div>
      )}
    </div>
  );
} 