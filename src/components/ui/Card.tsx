import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

export default function Card({
  children,
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-5 md:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-[#e5ece7] shadow-sm ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
