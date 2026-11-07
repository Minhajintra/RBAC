import React from "react";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * Reset Password Page Header
 * Renders the top security tag, heading, and subtitle for password reset
 */
export function PageHeader({
  title = "Keep your account safe",
  subtitle = "Follow these best practices to ensure strong access security:",
}: PageHeaderProps) {
  return (
    <div>
      <div className="w-full h-2.5 rounded-full bg-[#245b43] mb-6 sm:mb-8"></div>

      <span className="block text-[10px] sm:text-[10.5px] font-bold tracking-wider uppercase text-[#245b43] mb-2 sm:mb-2.5">
        PASSWORD GUIDELINES
      </span>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11261c] mb-2.5 tracking-tight">
        {title}
      </h2>

      <p className="text-xs sm:text-sm text-[#4a5e52] mb-6 leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

export default PageHeader;

