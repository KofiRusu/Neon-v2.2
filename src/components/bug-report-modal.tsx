'use client';

import { useState } from 'react';
import { Bug, X, Send, AlertTriangle, Info, Zap } from 'lucide-react';
import { Button } from './ui/button';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [page, setPage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mock bug report submission - you can integrate with your actual bug tracking
    const bugReport = {
      title,
      description,
      steps,
      priority,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.log('Bug Report Submitted:', bugReport);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    setSteps('');
    setPriority('medium');
    onClose();
    
    // Show success message (you can integrate with toast notifications)
    alert('Bug report submitted successfully! Thank you for helping improve NeonHub.');
  };

  const priorityIcons = {
    low: <Info className="h-4 w-4 text-blue-500" />,
    medium: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    high: <AlertTriangle className="h-4 w-4 text-orange-500" />,
    critical: <Zap className="h-4 w-4 text-red-500" />
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Bug className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Report Bug</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bug Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md px-3 py-2 border border-slate-600 focus:border-purple-500 focus:outline-none"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                    priority === p
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {priorityIcons[p]}
                  <span className="capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md px-3 py-2 border border-slate-600 focus:border-purple-500 focus:outline-none"
              rows={3}
              placeholder="What happened? What did you expect to happen?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Steps to Reproduce
            </label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-md px-3 py-2 border border-slate-600 focus:border-purple-500 focus:outline-none"
              rows={3}
              placeholder="1. Go to... 2. Click on... 3. Expected vs actual result..."
            />
          </div>

          <div className="bg-slate-700/50 p-3 rounded-md text-sm text-gray-400">
            <p><strong>Auto-captured info:</strong></p>
            <p>Page: {typeof window !== 'undefined' ? window.location.pathname : 'Unknown'}</p>
            <p>Browser: {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'Unknown'}</p>
            <p>Time: {new Date().toLocaleString()}</p>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !title || !description}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Bug Report'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 