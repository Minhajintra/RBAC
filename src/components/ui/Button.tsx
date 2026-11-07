import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-bold rounded-xl transition-all select-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-[#225740] hover:bg-[#183f2e] text-white focus:ring-[#225740] shadow-sm active:scale-[0.99]",
    secondary:
      "bg-white hover:bg-[#f4f7f4] text-[#16382b] border border-[#dbe5dd] focus:ring-[#225740]",
    danger:
      "bg-[#b42318] hover:bg-[#911d13] text-white focus:ring-[#b42318] shadow-sm",
    ghost:
      "bg-transparent hover:bg-[#e6efe8] text-[#225740] focus:ring-[#225740]",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
