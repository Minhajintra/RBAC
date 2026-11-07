"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * Dashboard Page Header
 * Renders greeting with user name and current date badge
 */
export function PageHeader({
  title,
  subtitle = "Here's what's happening across your user access workspace.",
}: PageHeaderProps) {
  const { user } = useAuth();
  const [dateBadge, setDateBadge] = useState("");

  useEffect(() => {
    setDateBadge(
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
        .format(new Date())
        .toUpperCase(),
    );
  }, []);

  const getGreeting = () => {
    if (title) return title;
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
    const name = user?.name || "Administrator";
    return `${timeGreeting}, ${name}`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#11261c] tracking-tight">
          {getGreeting()}
        </h1>
        <p className="text-xs sm:text-sm text-[#6b7c72] mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="self-start sm:self-auto px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#e6efe8] text-[#1e4d3a] tracking-wider uppercase border border-[#c7ded0]">
        {dateBadge || "TODAY"}
      </div>
    </div>
  );
}

export default PageHeader;

