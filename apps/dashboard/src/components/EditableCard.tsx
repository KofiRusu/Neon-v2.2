'use client';

import { useState } from 'react';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface EditableCardProps {
  title: string;
  value: string;
  description?: string;
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
  onCopy?: () => void;
  disabled?: boolean;
  multiline?: boolean;
  className?: string;
  type?: 'text' | 'email' | 'url' | 'password';
  maxLength?: number;
}

export default function EditableCard({
  title,
  value,
  description,
  placeholder,
  onSave,
  onCopy,
  disabled = false,
  multiline = false,
  className = '',
  type = 'text',
  maxLength,
}: EditableCardProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
    setSaveStatus(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setSaveStatus(null);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setSaveStatus(null);

    try {
      await onSave(editValue);
      setSaveStatus('success');
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!onCopy) return;
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`glass-strong p-6 rounded-2xl transition-all duration-200 ${
      isEditing ? 'ring-2 ring-neon-blue ring-opacity-50' : ''
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          {description && (
            <p className="text-sm text-secondary mt-1">{description}</p>
          )}
        </div>

        {/* Status Indicator */}
        {saveStatus && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${
            saveStatus === 'success' 
              ? 'bg-neon-green/20 text-neon-green' 
              : 'bg-neon-pink/20 text-neon-pink'
          }`}>
            {saveStatus === 'success' ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4" />
            )}
            <span>{saveStatus === 'success' ? 'Saved' : 'Error'}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            {/* Input */}
            {multiline ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={isLoading}
                className="w-full p-3 glass rounded-xl border border-gray-600 text-primary placeholder-gray-400 focus:outline-none focus:border-neon-blue transition-colors resize-none"
                rows={4}
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={isLoading}
                className="w-full p-3 glass rounded-xl border border-gray-600 text-primary placeholder-gray-400 focus:outline-none focus:border-neon-blue transition-colors"
                autoFocus
              />
            )}

            {/* Character Count */}
            {maxLength && (
              <div className="text-xs text-secondary text-right">
                {editValue.length}/{maxLength}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                disabled={isLoading || editValue === value}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                  isLoading || editValue === value
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'btn-neon hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>Save</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="p-2 text-secondary hover:text-primary transition-colors border border-gray-600 rounded-xl hover:border-gray-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Display Value */}
            <div className="relative group">
              <div className={`p-3 glass rounded-xl border border-gray-600 text-primary ${
                multiline ? 'whitespace-pre-wrap min-h-[100px]' : 'truncate'
              }`}>
                {value || (
                  <span className="text-gray-400">{placeholder || 'No value set'}</span>
                )}
              </div>

              {/* Hover Actions */}
              <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onCopy && (
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      copied 
                        ? 'bg-neon-green/20 text-neon-green' 
                        : 'bg-gray-800/80 text-secondary hover:text-neon-blue'
                    }`}
                    title="Copy to clipboard"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                )}

                {!disabled && (
                  <button
                    onClick={handleEdit}
                    className="p-2 bg-gray-800/80 text-secondary hover:text-neon-blue rounded-lg transition-all duration-200"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Edit Button */}
            {!disabled && (
              <button
                onClick={handleEdit}
                className="text-sm text-secondary hover:text-neon-blue transition-colors flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit {title.toLowerCase()}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 