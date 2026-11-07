import React from "react";

export type BadgeVariant =
  "success" | "warning" | "danger" | "neutral" | "info" | "primary";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  variant = "neutral",
  children,
  dot = false,
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles: Record<
    BadgeVariant,
    { container: string; dot: string }
  > = {
    success: {
      container: "bg-[#e6efe8] text-[#225740]",
      dot: "bg-[#225740]",
    },
    warning: {
      container: "bg-[#fdeccf] text-[#8a5200]",
      dot: "bg-[#8a5200]",
    },
    danger: {
      container: "bg-[#fde4e4] text-[#b42318]",
      dot: "bg-[#b42318]",
    },
    neutral: {
      container: "bg-[#edf2ee] text-[#55695e]",
      dot: "bg-[#55695e]",
    },
    info: {
      container: "bg-[#e0f2fe] text-[#0369a1]",
      dot: "bg-[#0369a1]",
    },
    primary: {
      container: "bg-[#225740] text-white",
      dot: "bg-white",
    },
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-[11px]",
  };

  const style = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold select-none ${sizeStyles[size]} ${style.container} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`}
        />
      )}
      {children}
    </span>
  );
}
