'use client';

import {
  ShieldCheckIcon,
  PencilIcon,
  EyeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

type Role = 'admin' | 'editor' | 'viewer' | 'member';

interface RoleBadgeProps {
  role: Role;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function RoleBadge({
  role,
  className = '',
  showIcon = true,
  size = 'md',
}: RoleBadgeProps): JSX.Element {
  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          icon: ShieldCheckIcon,
          colors: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
          description: 'Full access and management permissions',
        };
      case 'editor':
        return {
          label: 'Editor',
          icon: PencilIcon,
          colors: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30',
          description: 'Can create and edit content',
        };
      case 'viewer':
        return {
          label: 'Viewer',
          icon: EyeIcon,
          colors: 'bg-neon-green/20 text-neon-green border-neon-green/30',
          description: 'Read-only access',
        };
      case 'member':
        return {
          label: 'Member',
          icon: UserIcon,
          colors: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
          description: 'Basic team member access',
        };
      default:
        return {
          label: 'Unknown',
          icon: UserIcon,
          colors: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
          description: 'Unknown role',
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'h-3 w-3',
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'h-5 w-5',
        };
      default:
        return {
          container: 'px-3 py-1 text-sm',
          icon: 'h-4 w-4',
        };
    }
  };

  const config = getRoleConfig();
  const sizeClasses = getSizeClasses();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center space-x-2 border rounded-full font-semibold transition-all duration-200 ${config.colors} ${sizeClasses.container} ${className}`}
      title={config.description}
    >
      {showIcon && <Icon className={sizeClasses.icon} />}
      <span>{config.label}</span>
    </div>
  );
} 