'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface FunnelVisualizerProps {
  data?: {
    timeframe: string;
    totalVisitors: number;
    steps: Array<{
      step: string;
      visitors: number;
      conversions: number;
      conversionRate: number;
      dropoffReasons: Array<{
        reason: string;
        percentage: number;
      }>;
    }>;
    regionBreakdown: Array<{
      region: string;
      visitors: number;
      conversionRate: number;
    }>;
  };
  darkMode: boolean;
  timeframe: string;
}

export function FunnelVisualizer({ data, darkMode, timeframe }: FunnelVisualizerProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  if (!data) {
    return (
      <div
        className={`backdrop-blur-xl rounded-2xl border p-6 h-96 flex items-center justify-center ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
        }`}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const stepIcons = {
    Visit: '👁️',
    'View Product': '🛍️',
    'Add to Cart': '🛒',
    Purchase: '💳',
  };

  return (
    <div className="space-y-6">
      {/* Funnel Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`backdrop-blur-xl rounded-2xl border p-6 ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 Conversion Funnel ({timeframe.toUpperCase()})
          </h3>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Visitors: {formatNumber(data.totalVisitors)}
          </div>
        </div>

        <div className="space-y-4">
          {data.steps.map((step, index) => {
            const isLast = index === data.steps.length - 1;
            const dropoffRate = isLast
              ? 0
              : ((data.steps[index].visitors - data.steps[index + 1]?.visitors) /
                  data.steps[index].visitors) *
                100;

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedStep(selectedStep === step.step ? null : step.step)}
                className={`relative cursor-pointer transition-all duration-300 ${
                  selectedStep === step.step ? 'transform scale-102' : ''
                }`}
              >
                {/* Funnel Step */}
                <div
                  className={`relative rounded-xl border p-4 ${
                    darkMode ? 'bg-white/5 border-white/10' : 'bg-white/50 border-gray-200/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {stepIcons[step.step as keyof typeof stepIcons] || '📈'}
                      </div>
                      <div>
                        <div
                          className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {step.step}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatNumber(step.visitors)} visitors
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          step.conversionRate > 50
                            ? 'text-green-400'
                            : step.conversionRate > 20
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }`}
                      >
                        {step.conversionRate}%
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        conversion
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div
                      className={`w-full h-2 rounded-full ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          step.conversionRate > 50
                            ? 'bg-green-400'
                            : step.conversionRate > 20
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${step.conversionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Dropoff Arrow (between steps) */}
                {!isLast && (
                  <div className="flex justify-center my-2">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                        darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      <span className="text-sm">↓ {dropoffRate.toFixed(1)}% dropoff</span>
                    </div>
                  </div>
                )}

                {/* Expandable Dropoff Reasons */}
                {selectedStep === step.step && step.dropoffReasons.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <div
                      className={`rounded-xl border p-4 ${
                        darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <h4
                        className={`text-sm font-medium mb-3 ${
                          darkMode ? 'text-red-400' : 'text-red-700'
                        }`}
                      >
                        🚫 Dropoff Reasons
                      </h4>
                      <div className="space-y-2">
                        {step.dropoffReasons.map((reason, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span
                              className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}
                            >
                              {reason.reason}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                darkMode ? 'text-red-400' : 'text-red-700'
                              }`}
                            >
                              {reason.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Regional Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`backdrop-blur-xl rounded-2xl border p-6 ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          🌍 Regional Performance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.regionBreakdown.map((region, index) => (
            <motion.div
              key={region.region}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={`rounded-xl border p-4 ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white/50 border-gray-200/50'
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-lg font-semibold mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {region.region}
                </div>

                <div
                  className={`text-2xl font-bold mb-2 ${
                    region.conversionRate > 8
                      ? 'text-green-400'
                      : region.conversionRate > 6
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {region.conversionRate.toFixed(1)}%
                </div>

                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatNumber(region.visitors)} visitors
                </div>

                {/* Mini progress bar */}
                <div className="mt-3">
                  <div
                    className={`w-full h-1 rounded-full ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        region.conversionRate > 8
                          ? 'bg-green-400'
                          : region.conversionRate > 6
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                      }`}
                      style={{ width: `${(region.conversionRate / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
