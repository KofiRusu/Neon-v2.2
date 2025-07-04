'use client';

import { useState } from 'react';
import { Settings, Database, Trash2, Eye, ChevronUp, ChevronDown } from 'lucide-react';

export function QAToolsWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

  // Only show in staging environment
  if (environment !== 'staging') return null;

  const handleSeedData = () => {
    const data = { campaigns: 5, users: 4, agents: 5 };
    localStorage.setItem('qa_quick_data', JSON.stringify(data));
    console.log('QA: Quick data seeded');
  };

  const handleClearData = () => {
    Object.keys(localStorage).filter(key => key.startsWith('qa_')).forEach(key => localStorage.removeItem(key));
    console.log('QA: Data cleared');
  };

  const handleToggleDebug = () => {
    const debug = localStorage.getItem('qa_debug_mode') !== 'true';
    localStorage.setItem('qa_debug_mode', debug.toString());
    console.log('QA: Debug mode', debug ? 'enabled' : 'disabled');
  };

  const tools = [
    { icon: <Database className="h-4 w-4" />, label: 'Seed Data', action: handleSeedData, color: 'text-blue-400' },
    { icon: <Trash2 className="h-4 w-4" />, label: 'Clear Data', action: handleClearData, color: 'text-orange-400' },
    { icon: <Eye className="h-4 w-4" />, label: 'Toggle Debug', action: handleToggleDebug, color: 'text-green-400' }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg shadow-lg">
        {isExpanded && (
          <div className="p-2 space-y-1">
            {tools.map((tool, index) => (
              <button
                key={index}
                onClick={tool.action}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-white hover:bg-slate-700/50 rounded-md w-full"
              >
                <span className={tool.color}>{tool.icon}</span>
                <span className="text-gray-300">{tool.label}</span>
              </button>
            ))}
          </div>
        )}
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-4 py-3 text-sm text-white hover:bg-slate-700/50 rounded-lg w-full"
        >
          <Settings className="h-4 w-4 text-amber-400" />
          <span className="text-amber-400 font-medium">QA Utils</span>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
} 