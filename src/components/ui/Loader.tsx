import React from "react";
import { Loader2 } from "lucide-react";

export interface LoaderProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  text?: string;
  className?: string;
}

export default function Loader({
  size = "md",
  label,
  text,
  className = "",
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const displayText = label || text;

  return (
    <div
      role="status"
      className={`inline-flex items-center justify-center gap-2 text-[#225740] ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {displayText && (
        <span className="text-xs font-semibold text-[#6b7c72]">
          {displayText}
        </span>
      )}
    </div>
  );
}
