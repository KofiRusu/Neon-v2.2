'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    engagementLevel: 'high' | 'medium' | 'low';
    lastContact: Date;
    lifetimeValue: number;
    preferredChannel: 'email' | 'whatsapp' | 'phone' | 'chat' | 'social';
    aiPredictedAction: 'retarget' | 'ignore' | 'convert' | 'nurture';
    location: {
      country: string;
      region: string;
    };
    tags: string[];
    createdAt: Date;
  };
  darkMode: boolean;
}

const channelIcons = {
  email: '📧',
  whatsapp: '💬',
  phone: '📞',
  chat: '🗨️',
  social: '📱',
};

const actionColors = {
  retarget: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ignore: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  convert: 'bg-green-500/20 text-green-400 border-green-500/30',
  nurture: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const engagementColors = {
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function CustomerCard({ customer, darkMode }: CustomerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatLTV = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      className={`
        relative cursor-pointer rounded-2xl border backdrop-blur-xl overflow-hidden
        transition-all duration-300 hover:shadow-2xl
        ${
          darkMode
            ? 'bg-white/5 border-white/10 hover:bg-white/10'
            : 'bg-white/90 border-gray-200/50 hover:bg-white'
        }
      `}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              {customer.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-lg">
                  {customer.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </span>
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {customer.name}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {customer.email}
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-xl border text-sm font-medium ${
              engagementColors[customer.engagementLevel]
            }`}
          >
            {customer.engagementLevel.toUpperCase()}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatLTV(customer.lifetimeValue)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Lifetime Value
            </div>
          </div>

          <div>
            <div className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {channelIcons[customer.preferredChannel]}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {customer.preferredChannel}
            </div>
          </div>
        </div>

        {/* AI Predicted Action */}
        <div
          className={`px-3 py-2 rounded-xl border mb-4 ${actionColors[customer.aiPredictedAction]}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              🤖 AI Action: {customer.aiPredictedAction.toUpperCase()}
            </span>
            <span className="text-xs opacity-75">
              {customer.aiPredictedAction === 'convert'
                ? '🎯'
                : customer.aiPredictedAction === 'retarget'
                  ? '🔄'
                  : customer.aiPredictedAction === 'nurture'
                    ? '🌱'
                    : '⏸️'}
            </span>
          </div>
        </div>

        {/* Expandable Details */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="space-y-3 pt-3 border-t border-white/10">
            {/* Location */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📍 Location
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {customer.location.country}
              </span>
            </div>

            {/* Last Contact */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                💬 Last Contact
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatDistanceToNow(new Date(customer.lastContact), { addSuffix: true })}
              </span>
            </div>

            {/* Customer Since */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                🗓️ Customer Since
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {new Date(customer.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Tags */}
            {customer.tags.length > 0 && (
              <div>
                <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  🏷️ Tags
                </div>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-lg border ${
                        darkMode
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                  darkMode
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20'
                }`}
              >
                💬 Message
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                  darkMode
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30'
                    : 'bg-purple-500/10 border-purple-500/20 text-purple-600 hover:bg-purple-500/20'
                }`}
              >
                📊 Profile
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Glow effect for high-value customers */}
      {customer.lifetimeValue > 5000 && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 pointer-events-none" />
      )}
    </motion.div>
  );
}
