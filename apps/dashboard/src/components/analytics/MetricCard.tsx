import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ComponentType<any>;
  color: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  loading = false,
}: MetricCardProps) {
  return (
    <div className="stat-card group hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl flex items-center justify-center shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            changeType === "positive"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : changeType === "negative"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
          }`}
        >
          {change}
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <div className="flex items-center gap-2">
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <div className="w-16 h-8 bg-gray-700 rounded animate-pulse" />
            ) : (
              value
            )}
          </p>
          {loading && (
            <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}
