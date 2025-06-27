'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GeoDataPoint {
  countryCode: string;
  countryName: string;
  region: string;
  demandIntensity: number;
  engagementDelta: number;
  opportunityScore: number;
  topTrend: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  metrics: {
    leads: number;
    conversions: number;
    revenue: number;
    sessions: number;
  };
}

interface GeoHeatmapProps {
  data: GeoDataPoint[];
  layer: 'demand' | 'engagement' | 'opportunity' | 'revenue';
  darkMode: boolean;
  isLoading: boolean;
}

interface TooltipData {
  country: GeoDataPoint;
  x: number;
  y: number;
  visible: boolean;
}

export function GeoHeatmap({ data, layer, darkMode, isLoading }: GeoHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipData>({
    country: {} as GeoDataPoint,
    x: 0,
    y: 0,
    visible: false,
  });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const getValueForLayer = (country: GeoDataPoint): number => {
    switch (layer) {
      case 'demand':
        return country.demandIntensity;
      case 'engagement':
        return country.engagementDelta;
      case 'opportunity':
        return country.opportunityScore;
      case 'revenue':
        return country.metrics.revenue;
      default:
        return country.demandIntensity;
    }
  };

  const getColorIntensity = (value: number, layer: string): string => {
    let normalizedValue: number;

    switch (layer) {
      case 'demand':
      case 'opportunity':
        normalizedValue = Math.max(0, Math.min(100, value)) / 100;
        break;
      case 'engagement':
        // Engagement delta can be negative, normalize from -30 to 70
        normalizedValue = Math.max(0, Math.min(100, (value + 30) / 100));
        break;
      case 'revenue':
        // Normalize revenue (assuming max around 100k)
        normalizedValue = Math.max(0, Math.min(100, value / 1000)) / 100;
        break;
      default:
        normalizedValue = value / 100;
    }

    const intensity = Math.round(normalizedValue * 255);

    if (layer === 'engagement') {
      // Green for positive growth, red for negative
      return value > 0
        ? `rgba(34, 197, 94, ${normalizedValue * 0.8})` // Green
        : `rgba(239, 68, 68, ${Math.abs(normalizedValue) * 0.8})`; // Red
    } else if (layer === 'opportunity') {
      return `rgba(168, 85, 247, ${normalizedValue * 0.8})`; // Purple
    } else if (layer === 'revenue') {
      return `rgba(34, 197, 94, ${normalizedValue * 0.8})`; // Green
    } else {
      return `rgba(59, 130, 246, ${normalizedValue * 0.8})`; // Blue
    }
  };

  const handleCountryClick = (country: GeoDataPoint, event: React.MouseEvent) => {
    setSelectedCountry(selectedCountry === country.countryCode ? null : country.countryCode);

    const rect = mapRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        country,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        visible: true,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const formatValue = (value: number, layer: string): string => {
    switch (layer) {
      case 'demand':
      case 'opportunity':
        return `${value.toFixed(0)}%`;
      case 'engagement':
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
      case 'revenue':
        return `$${(value / 1000).toFixed(0)}K`;
      default:
        return value.toString();
    }
  };

  const getLayerLabel = (layer: string): string => {
    switch (layer) {
      case 'demand':
        return 'Demand Intensity';
      case 'engagement':
        return 'Engagement Growth';
      case 'opportunity':
        return 'Opportunity Score';
      case 'revenue':
        return 'Revenue Potential';
      default:
        return 'Value';
    }
  };

  const maxValue = Math.max(...data.map(d => getValueForLayer(d)));
  const minValue = Math.min(...data.map(d => getValueForLayer(d)));

  if (isLoading) {
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

  return (
    <div
      className={`backdrop-blur-xl rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getLayerLabel(layer)} Heatmap
          </h3>

          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Low</span>
              <div className="w-20 h-3 rounded-full bg-gradient-to-r from-transparent via-blue-300 to-blue-600" />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                High
              </span>
            </div>

            {/* Stats */}
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {data.length} countries
            </div>
          </div>
        </div>
      </div>

      {/* Interactive World Map */}
      <div ref={mapRef} className="relative h-96 overflow-hidden" onMouseLeave={handleMouseLeave}>
        {/* Simplified world map with data points */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-4 w-full max-w-4xl mx-auto p-6">
            {data.map(country => (
              <motion.div
                key={country.countryCode}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={e => handleCountryClick(country, e as any)}
                className={`
                  relative cursor-pointer rounded-lg p-4 border backdrop-blur-sm
                  transition-all duration-300 hover:shadow-lg
                  ${
                    selectedCountry === country.countryCode
                      ? 'ring-2 ring-blue-400 ring-opacity-50'
                      : ''
                  }
                `}
                style={{
                  backgroundColor: getColorIntensity(getValueForLayer(country), layer),
                  borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }}
              >
                <div
                  className={`text-xs font-medium mb-1 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {country.countryCode}
                </div>
                <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatValue(getValueForLayer(country), layer)}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {country.topTrend}
                </div>

                {/* Pulse effect for high values */}
                {getValueForLayer(country) > maxValue * 0.8 && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-red-400"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute z-10 p-4 rounded-lg border backdrop-blur-xl shadow-xl pointer-events-none ${
              darkMode
                ? 'bg-gray-900/90 border-white/20 text-white'
                : 'bg-white/90 border-gray-200 text-gray-900'
            }`}
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="space-y-2">
              <div className="font-semibold text-lg">{tooltip.country.countryName}</div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs opacity-70">{getLayerLabel(layer)}</div>
                  <div className="font-medium">
                    {formatValue(getValueForLayer(tooltip.country), layer)}
                  </div>
                </div>

                <div>
                  <div className="text-xs opacity-70">Top Trend</div>
                  <div className="font-medium">{tooltip.country.topTrend}</div>
                </div>

                <div>
                  <div className="text-xs opacity-70">Leads</div>
                  <div className="font-medium">
                    {tooltip.country.metrics.leads.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs opacity-70">Revenue</div>
                  <div className="font-medium">
                    ${(tooltip.country.metrics.revenue / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-xs opacity-70">Region: {tooltip.country.region}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Summary Stats */}
      <div className={`p-6 border-t ${darkMode ? 'border-white/10' : 'border-gray-200/50'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatValue(maxValue, layer)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Highest</div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatValue(minValue, layer)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lowest</div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatValue((maxValue + minValue) / 2, layer)}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Average</div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-bold text-blue-400`}>
              {data.filter(d => getValueForLayer(d) > maxValue * 0.7).length}
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Hot Spots
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
