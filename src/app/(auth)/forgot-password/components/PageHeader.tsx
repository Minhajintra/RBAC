import React from "react";
import Logo from "@/components/layout/Logo";

interface PageHeaderProps {
  logoHref?: string;
}

/**
 * Forgot Password Page Header
 * Renders the top logo header bar
 */
export function PageHeader({ logoHref = "/login" }: PageHeaderProps) {
  return (
    <div className="w-full max-w-6xl mx-auto mb-3 sm:mb-5 lg:mb-4 flex-shrink-0">
      <Logo href={logoHref} />
    </div>
  );
}

export default PageHeader;

