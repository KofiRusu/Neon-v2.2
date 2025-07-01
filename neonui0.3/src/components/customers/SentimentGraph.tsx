'use client';

import { motion } from 'framer-motion';

interface SentimentGraphProps {
  data?: {
    summary: {
      positive: number;
      neutral: number;
      negative: number;
      total: number;
      averageScore: number;
    };
    dailyData: Array<{
      date: string;
      positive: number;
      neutral: number;
      negative: number;
      total: number;
    }>;
    topKeywords: {
      positive: string[];
      negative: string[];
    };
  };
  darkMode: boolean;
  timeframe: string;
}

export function SentimentGraph({ data, darkMode, timeframe }: SentimentGraphProps) {
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

  const getSentimentEmoji = (score: number) => {
    if (score > 0.3) return '😊';
    if (score > 0) return '🙂';
    if (score > -0.3) return '😐';
    return '😞';
  };

  const maxValue = Math.max(
    ...data.dailyData.map(d => Math.max(d.positive, d.neutral, d.negative))
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl rounded-2xl border p-6 ${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
          }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">😊</div>
            <div className="text-2xl font-bold text-green-400">{data.summary.positive}%</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Positive
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`backdrop-blur-xl rounded-2xl border p-6 ${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
          }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">😐</div>
            <div className="text-2xl font-bold text-yellow-400">{data.summary.neutral}%</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Neutral</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`backdrop-blur-xl rounded-2xl border p-6 ${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
          }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">😞</div>
            <div className="text-2xl font-bold text-red-400">{data.summary.negative}%</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Negative
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`backdrop-blur-xl rounded-2xl border p-6 ${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
          }`}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">{getSentimentEmoji(data.summary.averageScore)}</div>
            <div
              className={`text-2xl font-bold ${
                data.summary.averageScore > 0
                  ? 'text-green-400'
                  : data.summary.averageScore < 0
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }`}
            >
              {(data.summary.averageScore * 100).toFixed(0)}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Avg Score
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`backdrop-blur-xl rounded-2xl border p-6 ${
          darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📈 Sentiment Trends ({timeframe.toUpperCase()})
        </h3>

        <div className="relative h-64">
          <svg className="w-full h-full" viewBox="0 0 800 200">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={200 - y * 2}
                x2="800"
                y2={200 - y * 2}
                stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                strokeWidth="1"
              />
            ))}

            {/* Positive trend line */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              points={data.dailyData
                .map((d, i) => `${(i / (data.dailyData.length - 1)) * 800},${200 - d.positive * 2}`)
                .join(' ')}
            />

            {/* Negative trend line */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              points={data.dailyData
                .map((d, i) => `${(i / (data.dailyData.length - 1)) * 800},${200 - d.negative * 2}`)
                .join(' ')}
            />

            {/* Data points */}
            {data.dailyData.map((d, i) => (
              <g key={i}>
                <circle
                  cx={(i / (data.dailyData.length - 1)) * 800}
                  cy={200 - d.positive * 2}
                  r="3"
                  fill="#10b981"
                />
                <circle
                  cx={(i / (data.dailyData.length - 1)) * 800}
                  cy={200 - d.negative * 2}
                  r="3"
                  fill="#ef4444"
                />
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Positive
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Negative
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`backdrop-blur-xl rounded-2xl border p-6 ${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
          }`}
        >
          <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🟢 Positive Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.topKeywords.positive.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`backdrop-blur-xl rounded-2xl border p-6 ${
            darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
          }`}
        >
          <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🔴 Negative Keywords
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.topKeywords.negative.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
