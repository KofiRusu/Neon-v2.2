'use client';

import { Inter } from 'next/font/google';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Code, Mail, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function V0IntegrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const navItems = [
    {
      href: '/v0-integration/content',
      label: 'Content Agent',
      icon: Code,
      description: 'Generate blogs, social posts, and marketing copy',
    },
    {
      href: '/v0-integration/seo',
      label: 'SEO Agent',
      icon: Search,
      description: 'Optimize content and analyze SEO performance',
    },
    {
      href: '/v0-integration/email',
      label: 'Email Agent',
      icon: Mail,
      description: 'Create email sequences and newsletters',
    },
  ];

  const currentAgent = navItems.find(item => pathname.includes(item.href.split('/').pop() || ''));

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 ${inter.className}`}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Header */}
      <header className="relative border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="w-px h-6 bg-gray-700" />
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                  <Bot className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">AI Agent Hub</h1>
                  <p className="text-gray-400 text-sm">Interactive AI Agent Testing Environment</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-sm text-gray-300">v0-integration</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
} 