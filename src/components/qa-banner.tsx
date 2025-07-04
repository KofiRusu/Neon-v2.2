'use client';

import { useState } from 'react';
import { X, Settings } from 'lucide-react';

export function QABanner() {
  const [isVisible, setIsVisible] = useState(true);
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

  // Only show in staging environment
  if (environment !== 'staging' || !isVisible) return null;

  return (
    <div className="bg-amber-500/90 text-amber-900 px-4 py-2 flex items-center justify-between text-sm font-medium relative z-50">
      <div className="flex items-center space-x-3">
        <Settings className="h-4 w-4" />
        <span className="font-semibold">STAGING MODE</span>
        <span className="text-amber-800">•</span>
        <span>Test Environment Active</span>
      </div>
      
      <button
        onClick={() => setIsVisible(false)}
        className="hover:bg-amber-600/20 rounded p-1 transition-colors"
        aria-label="Close staging banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
} 