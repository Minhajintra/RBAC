import React from "react";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * Verify OTP Page Header
 * Renders the top security tag, title, and description
 */
export function PageHeader({
  title = "One more step to sign in",
  subtitle = "A quick verification helps keep your workspace and users safe.",
}: PageHeaderProps) {
  return (
    <div>
      <div className="w-full h-2.5 rounded-full bg-[#245b43] mb-6 sm:mb-8"></div>

      <span className="block text-[10px] sm:text-[10.5px] font-bold tracking-wider uppercase text-[#245b43] mb-2 sm:mb-2.5">
        ACCOUNT SECURITY
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

