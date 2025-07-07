'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Code, Search, Mail, Bot, Sparkles, ArrowRight, Zap, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function V0IntegrationHomePage() {
  const agents = [
    {
      id: 'content',
      title: 'Content Agent',
      description: 'Generate high-quality content for blogs, social media, and marketing materials with AI-powered writing assistance.',
      icon: Code,
      href: '/v0-integration/content',
      features: ['Blog Posts', 'Social Media', 'Marketing Copy', 'SEO Optimization'],
      color: 'from-blue-600/20 to-cyan-600/20',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      id: 'seo',
      title: 'SEO Agent',
      description: 'Optimize your content for search engines with comprehensive SEO analysis, keyword research, and technical audits.',
      icon: Search,
      href: '/v0-integration/seo',
      features: ['Content Analysis', 'Keyword Research', 'Meta Tags', 'Technical Audit'],
      color: 'from-green-600/20 to-emerald-600/20',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-400',
    },
    {
      id: 'email',
      title: 'Email Agent',
      description: 'Create powerful email marketing campaigns with AI-driven personalization, sequence generation, and performance analysis.',
      icon: Mail,
      href: '/v0-integration/email',
      features: ['Email Sequences', 'Personalization', 'Performance Analytics', 'Newsletter Creation'],
      color: 'from-purple-600/20 to-pink-600/20',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
  ];

  const stats = [
    { label: 'AI Agents', value: '3', icon: Bot },
    { label: 'Capabilities', value: '15+', icon: Zap },
    { label: 'Use Cases', value: '50+', icon: Target },
    { label: 'Success Rate', value: '95%', icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
            <Sparkles className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">
            AI Agent Hub
          </h1>
        </div>
        
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Experience the future of AI-powered content creation, SEO optimization, and email marketing. 
          Our intelligent agents work together to supercharge your marketing efforts.
        </p>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>All agents online and ready</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="glass border-gray-700/50 bg-gray-900/20">
              <CardContent className="p-4 text-center">
                <Icon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Agent Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 3) }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className={`glass border-gray-700/50 bg-gradient-to-br ${agent.color} hover:${agent.borderColor} transition-all duration-300 h-full`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${agent.color} border ${agent.borderColor}`}>
                      <Icon className={`h-6 w-6 ${agent.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white">{agent.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        AI-Powered
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {agent.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-200">Key Features:</div>
                    <div className="grid grid-cols-2 gap-1">
                      {agent.features.map((feature) => (
                        <div key={feature} className="flex items-center space-x-1 text-xs text-gray-400">
                          <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Link href={agent.href}>
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-white group-hover:scale-105 transition-all duration-200"
                    >
                      <span>Launch {agent.title}</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Getting Started Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="glass border-gray-700/50 bg-gray-900/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white text-center">
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto">
                  <span className="text-blue-400 font-bold text-sm">1</span>
                </div>
                <h3 className="font-medium text-white">Choose an Agent</h3>
                <p className="text-sm text-gray-400">Select the AI agent that matches your needs</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto">
                  <span className="text-purple-400 font-bold text-sm">2</span>
                </div>
                <h3 className="font-medium text-white">Configure Settings</h3>
                <p className="text-sm text-gray-400">Customize the agent parameters for your use case</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center mx-auto">
                  <span className="text-green-400 font-bold text-sm">3</span>
                </div>
                <h3 className="font-medium text-white">Generate Results</h3>
                <p className="text-sm text-gray-400">Watch as AI creates high-quality output in seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 