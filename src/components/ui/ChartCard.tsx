import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Loader from "./Loader";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Analytics card wrapper component: Header, actions, loading, aur error states
export default function ChartCard({
  title,
  subtitle,
  headerAction,
  actions,
  badge,
  children,
  isLoading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyMessage = "No analytics data available for the selected period.",
  className = "",
}: ChartCardProps) {
  const rightControls = badge || actions || headerAction;

  return (
    <div
      className={`bg-white rounded-2xl border border-[#e5ece7] p-4 sm:p-5 md:p-6 shadow-sm flex flex-col justify-between ${className}`}
    >
      {/* Card Header: Title, subtitle aur controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#16382b] tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#6b7c72] mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {rightControls && (
          <div className="flex items-center gap-2">
            {badge}
            {actions || headerAction}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-[220px] flex flex-col justify-center relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <Loader size="md" />
            <span className="text-xs font-semibold text-[#6b7c72]">
              Loading chart data...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <AlertCircle className="w-8 h-8 text-[#d92d20] mb-2" />
            <p className="text-xs font-bold text-[#b42318] mb-1">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#225740] bg-[#e6efe8] hover:bg-[#d0e2d4] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[#6b7c72]">
            <p className="text-xs font-medium">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
