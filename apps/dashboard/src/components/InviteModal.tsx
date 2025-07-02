'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import RoleBadge from './RoleBadge';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
}

type Role = 'admin' | 'editor' | 'viewer' | 'member';

export default function InviteModal({
  isOpen,
  onClose,
  onInvite,
}: InviteModalProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const roles: { value: Role; label: string; description: string }[] = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Full access to all features and settings',
    },
    {
      value: 'editor',
      label: 'Editor',
      description: 'Can create and edit content, limited settings access',
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'Read-only access to content and analytics',
    },
    {
      value: 'member',
      label: 'Member',
      description: 'Basic team member access',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !selectedRole) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onInvite(email, selectedRole);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setEmail('');
        setSelectedRole('member');
        onClose();
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setEmail('');
    setSelectedRole('member');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass-strong p-6 rounded-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center">
              <UserGroupIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Invite Team Member</h2>
              <p className="text-sm text-secondary">Send an invitation to join your team</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-secondary hover:text-primary transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="bg-neon-green/20 border border-neon-green/30 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-neon-green" />
              <div>
                <h3 className="text-sm font-semibold text-neon-green">Invitation Sent!</h3>
                <p className="text-xs text-secondary">
                  {email} will receive an email invitation to join your team.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-neon-pink/20 border border-neon-pink/30 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-neon-pink" />
              <div>
                <h3 className="text-sm font-semibold text-neon-pink">Invitation Failed</h3>
                <p className="text-xs text-secondary">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || success}
                placeholder="colleague@company.com"
                className="w-full pl-10 pr-4 py-3 glass rounded-xl border border-gray-600 text-primary placeholder-gray-400 focus:outline-none focus:border-neon-blue transition-colors"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-primary mb-3">
              Role & Permissions
            </label>
            <div className="space-y-3">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedRole === role.value
                      ? 'border-neon-blue bg-neon-blue/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                    disabled={isLoading || success}
                    className="hidden"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <RoleBadge role={role.value} size="sm" />
                    </div>
                    <p className="text-xs text-secondary">{role.description}</p>
                  </div>
                  
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    selectedRole === role.value
                      ? 'border-neon-blue bg-neon-blue'
                      : 'border-gray-600'
                  }`}>
                    {selectedRole === role.value && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-secondary border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isLoading || !email || success}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                isLoading || !email || success
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'btn-neon hover:scale-105'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 