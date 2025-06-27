'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  SparklesIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  MegaphoneIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Overview', href: '/', icon: ChartBarIcon },
    { name: 'AI Agents', href: '/agents', icon: SparklesIcon },
    { name: 'Campaigns', href: '/campaigns', icon: MegaphoneIcon },
    { name: 'Analytics', href: '/analytics', icon: ArrowTrendingUpIcon },
  ];

  return (
    <>
      {/* Header */}
      <header className="bg-dark-800/80 backdrop-blur-md border-b border-dark-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <SparklesIcon className="h-8 w-8 text-neon-400 animate-glow" />
                  <div className="absolute inset-0 bg-neon-400 rounded-full blur-sm opacity-30 animate-pulse"></div>
                </div>
                <h1 className="text-2xl font-bold text-gradient neon-text">NeonHub AI</h1>
              </div>
              <span className="text-dark-400 hidden md:block">Marketing Ecosystem</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search agents, campaigns..."
                  className="input pl-10 pr-4 w-64"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Notifications */}
              <button className="btn-secondary relative">
                <BellIcon className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-400 rounded-full animate-pulse"></span>
              </button>

              {/* Settings */}
              <button className="btn-secondary">
                <CogIcon className="h-5 w-5" />
              </button>

              {/* User Avatar */}
              <div className="w-10 h-10 bg-gradient-to-r from-neon-400 to-neon-500 rounded-full flex items-center justify-center neon-glow">
                <span className="text-white font-medium">N</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="w-64 sidebar min-h-screen sticky top-20">
        <nav className="p-4 space-y-2">
          {navigationItems.map(item => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;

            return (
              <a
                key={item.name}
                href={item.href}
                className={`nav-item w-full ${isActive ? 'active' : ''}`}
              >
                <IconComponent className="h-5 w-5 mr-3" />
                {item.name}
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
