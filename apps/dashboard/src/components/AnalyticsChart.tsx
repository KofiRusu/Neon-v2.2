"use client";

import { useState } from "react";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  className?: string;
  color?: "neon-blue" | "neon-green" | "neon-purple" | "neon-pink";
  showTrend?: boolean;
}

export default function AnalyticsChart({
  data,
  title,
  subtitle,
  className = "",
  color = "neon-blue",
  showTrend = true,
}: AnalyticsChartProps): JSX.Element {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);

  // Calculate trend
  const calculateTrend = () => {
    if (data.length < 2) return { trend: 0, direction: "neutral" as const };

    const first = data[0].value;
    const last = data[data.length - 1].value;
    const trend = ((last - first) / first) * 100;

    return {
      trend: Math.abs(trend),
      direction:
        trend > 0
          ? ("up" as const)
          : trend < 0
            ? ("down" as const)
            : ("neutral" as const),
    };
  };

  const { trend, direction } = calculateTrend();
  const maxValue = Math.max(...data.map((d) => d.value));

  const getColorClasses = () => {
    switch (color) {
      case "neon-green":
        return {
          bar: "bg-neon-green",
          accent: "text-neon-green",
          border: "border-neon-green",
        };
      case "neon-purple":
        return {
          bar: "bg-neon-purple",
          accent: "text-neon-purple",
          border: "border-neon-purple",
        };
      case "neon-pink":
        return {
          bar: "bg-neon-pink",
          accent: "text-neon-pink",
          border: "border-neon-pink",
        };
      default:
        return {
          bar: "bg-neon-blue",
          accent: "text-neon-blue",
          border: "border-neon-blue",
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`glass-strong p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          {subtitle && (
            <p className="text-sm text-secondary mt-1">{subtitle}</p>
          )}
        </div>

        {showTrend && (
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${
              direction === "up"
                ? "bg-neon-green/20 text-neon-green"
                : direction === "down"
                  ? "bg-neon-pink/20 text-neon-pink"
                  : "bg-gray-600/20 text-gray-400"
            }`}
          >
            {direction === "up" ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : direction === "down" ? (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            ) : (
              <ChartBarIcon className="h-4 w-4" />
            )}
            <span>
              {direction === "neutral" ? "No change" : `${trend.toFixed(1)}%`}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Chart Container */}
        <div className="flex items-end space-x-2 h-32 mb-4">
          {data.map((point, index) => {
            const height = (point.value / maxValue) * 100;
            const isSelected = selectedPoint?.date === point.date;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center cursor-pointer group"
                onMouseEnter={() => setSelectedPoint(point)}
                onMouseLeave={() => setSelectedPoint(null)}
              >
                {/* Value Label */}
                {(isSelected || data.length <= 7) && (
                  <div
                    className={`text-xs font-semibold mb-1 transition-opacity ${
                      isSelected
                        ? colors.accent
                        : "text-secondary opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {point.value.toLocaleString()}
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isSelected
                      ? `${colors.bar} shadow-lg shadow-${color}/50 scale-105`
                      : `${colors.bar}/80 hover:${colors.bar} hover:shadow-lg hover:shadow-${color}/30`
                  }`}
                  style={{ height: `${height}%` }}
                />

                {/* Date Label */}
                <div className="text-xs text-muted mt-2 text-center">
                  {new Date(point.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Point Details */}
        {selectedPoint && (
          <div className="glass p-3 rounded-xl border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-primary">
                  {new Date(selectedPoint.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                {selectedPoint.label && (
                  <div className="text-xs text-secondary mt-1">
                    {selectedPoint.label}
                  </div>
                )}
              </div>
              <div className={`text-xl font-bold ${colors.accent}`}>
                {selectedPoint.value.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-sm font-semibold text-primary">
            {Math.max(...data.map((d) => d.value)).toLocaleString()}
          </div>
          <div className="text-xs text-secondary">Peak</div>
        </div>

        <div className="text-center">
          <div className="text-sm font-semibold text-primary">
            {Math.round(
              data.reduce((sum, d) => sum + d.value, 0) / data.length,
            ).toLocaleString()}
          </div>
          <div className="text-xs text-secondary">Average</div>
        </div>

        <div className="text-center">
          <div className="text-sm font-semibold text-primary">
            {data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </div>
          <div className="text-xs text-secondary">Total</div>
        </div>
      </div>
    </div>
  );
}
