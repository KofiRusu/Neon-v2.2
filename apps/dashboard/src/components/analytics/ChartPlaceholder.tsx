interface ChartPlaceholderProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  loading?: boolean;
  data?: string;
  className?: string;
}

export function ChartPlaceholder({
  title,
  description,
  icon: Icon,
  loading = false,
  data,
  className = "h-64",
}: ChartPlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center text-gray-400 ${className}`}
    >
      <div className="text-center">
        <Icon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm text-gray-500 mt-2">
          {loading ? "Loading data..." : data || description}
        </p>
      </div>
    </div>
  );
}
