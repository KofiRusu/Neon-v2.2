'use client';

import { useState } from 'react';

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostEditorModal({ isOpen, onClose }: PostEditorModalProps): JSX.Element | null {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [scheduledTime, setScheduledTime] = useState('');

  const platforms = [
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-600' },
    { id: 'twitter', name: 'Twitter', color: 'bg-blue-500' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
  ];

  const togglePlatform = (platformId: string): void => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]
    );
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    // Handle post creation/scheduling
    // TODO: Implement actual post creation/scheduling logic
    const postData = { content, selectedPlatforms, scheduledTime };
    // In a real app, this would call an API
    void postData; // Acknowledge usage to avoid unused variable warning
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-dark-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Create New Post</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">Post Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-32 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <div className="mt-2 text-right text-sm text-neutral-400">{content.length}/280</div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Select Platforms
            </label>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map(platform => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? `${platform.color} border-transparent text-white`
                      : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                  }`}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Add Media (Optional)
            </label>
            <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-neutral-600 transition-colors">
              <div className="text-neutral-400">
                <p>Drag & drop images here, or click to browse</p>
                <p className="text-sm mt-1">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input type="file" className="hidden" accept="image/*" multiple />
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Schedule Post (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || selectedPlatforms.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scheduledTime ? 'Schedule Post' : 'Publish Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
