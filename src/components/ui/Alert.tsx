import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

export default function Alert({
  variant = "info",
  title,
  message,
  className = "",
  onClose,
}: AlertProps) {
  const variantStyles = {
    success: {
      container: "bg-[#e6efe8] border-[#c7ded0] text-[#1e4d3a]",
      icon: (
        <CheckCircle2 className="w-4 h-4 text-[#225740] flex-shrink-0 mt-0.5" />
      ),
    },
    error: {
      container: "bg-[#fde4e4] border-[#fca5a5] text-[#b42318]",
      icon: (
        <AlertCircle className="w-4 h-4 text-[#d92d20] flex-shrink-0 mt-0.5" />
      ),
    },
    warning: {
      container: "bg-[#fef3c7] border-[#fcd34d] text-[#92400e]",
      icon: (
        <AlertTriangle className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />
      ),
    },
    info: {
      container: "bg-[#e0f2fe] border-[#bae6fd] text-[#0369a1]",
      icon: <Info className="w-4 h-4 text-[#0284c7] flex-shrink-0 mt-0.5" />,
    },
  };

  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1 leading-relaxed">
        {title && <span className="font-bold block mb-0.5">{title}</span>}
        <span className="font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close alert"
          className="hover:opacity-75 font-bold cursor-pointer ml-1"
        >
          ×
        </button>
      )}
    </div>
  );
}
