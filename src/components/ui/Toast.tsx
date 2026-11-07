import React, { useEffect } from "react";
import { Check, X, AlertCircle } from "lucide-react";

export interface ToastProps {
  title: string;
  description?: string;
  variant?: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  title,
  description,
  variant = "success",
  onClose,
  duration = 3200,
}: ToastProps) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="status"
      className="fixed bottom-5 right-5 z-50 bg-white rounded-xl shadow-xl p-4 border border-[#dbe5dd] flex items-start gap-3 min-w-[280px] max-w-sm animate-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
          variant === "success" ? "bg-[#225740]" : "bg-[#b42318]"
        }`}
      >
        {variant === "success" ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-[#16382b]">{title}</h4>
        {description && (
          <p className="text-[11px] text-[#6b7c72] mt-0.5 leading-tight">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
