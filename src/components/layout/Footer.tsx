"use client";

import React from "react";
import { usePathname } from "next/navigation";

/**
 * Standard Application Layout Footer
 * Preserves the exact styling and branding of the IntraShip portal and design previews
 */
export default function Footer() {
  const pathname = usePathname();

  let footerText = "IntraShip UAM • User & Access Management System";

  if (pathname.startsWith("/audit")) {
    footerText = "IntraShip UAM • Audit Logs concept • Sample data for design preview";
  } else if (pathname.startsWith("/settings")) {
    footerText = "IntraShip UAM • Sample data for design preview • Deployment values shown in brackets";
  }

  return (
    <footer className="pt-2 pb-6 text-center text-[11px] sm:text-xs text-[#6b7c72]">
      {footerText}
    </footer>
  );
}
