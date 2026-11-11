"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Menu, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const HEADER_CONFIG = {
  breadcrumbRoot: "Workspace",
  breadcrumbCurrent: "Dashboard",
  searchPlaceholder: "Search users, roles...",
  language: "EN",
};

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  breadcrumbCurrent?: string;
}

export default function Header({
  onOpenMobileSidebar,
  breadcrumbCurrent,
}: HeaderProps) {
  const header = HEADER_CONFIG;
  const { user, isLoading } = useAuth();
  const userName = user?.name || "";
  const userRole = user?.role || "";
  const userInitials =
    user?.initials ||
    (userName
      ? userName
          .split(" ")
          .filter(Boolean)
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : user?.email
        ? (user.email[0] || "U").toUpperCase()
        : "--");

  const currentUser = {
    name: userName,
    role: userRole,
    initials: userInitials,
  };
  const pathname = usePathname();
  const currentCrumb = breadcrumbCurrent
    ? breadcrumbCurrent
    : pathname.startsWith("/audit")
      ? "Audit Logs"
      : pathname.startsWith("/settings")
        ? "Security Settings"
        : pathname.startsWith("/users")
          ? "Users"
          : pathname.startsWith("/roles")
            ? "Roles & Permissions"
            : pathname.startsWith("/requests")
              ? "Access Requests"
              : header.breadcrumbCurrent;
  const [searchOpen, setSearchOpen] = useState(false);

  // TODO: connect notifications button with WebSocket notification stream
  const onNotificationsClick = () => {
    alert("No unread notifications at this time.");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 bg-white/85 backdrop-blur-md border-b border-[#e5ece7]">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="p-2 -ml-1 rounded-xl text-[#16382b] hover:bg-gray-100 md:hidden transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="text-xs text-[#6b7c72] flex items-center gap-1.5"
        >
          <span className="hidden xs:inline">{header.breadcrumbRoot}</span>
          <span className="hidden xs:inline text-gray-300">/</span>
          <span className="font-bold text-[#16382b]">{currentCrumb}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop search */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={header.searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 py-1.5 text-xs bg-[#f4f7f4] border border-[#dbe5dd] rounded-xl focus:bg-white focus:border-[#225740] focus:ring-1 focus:ring-[#225740] outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Mobile search toggle */}
        <button
          type="button"
          onClick={() => setSearchOpen((prev) => !prev)}
          aria-label="Toggle search bar"
          className="p-2 text-[#16382b] hover:bg-gray-100 rounded-xl md:hidden transition-colors cursor-pointer"
        >
          {searchOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>

        <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#f4f7f4] border border-[#dbe5dd] text-[11px] font-semibold text-[#16382b]">
          {header.language}
        </div>

        {/* <button
          type="button"
          onClick={onNotificationsClick}
          aria-label="Notifications"
          className="relative p-2 text-[#16382b] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#225740] ring-2 ring-white"></span>
        </button> */}

        {/* User profile dropdown badge */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#e5ece7]">
          <div className="w-8 h-8 rounded-full bg-[#225740] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentUser.initials}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#11261c] leading-tight">
              {currentUser.name || (isLoading ? "Loading..." : "User")}
            </span>
            <span className="text-[10px] text-[#6b7c72] leading-tight">
              {currentUser.role || (isLoading ? "..." : "Admin")}
            </span>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="absolute top-full left-0 right-0 p-3 bg-white border-b border-[#e5ece7] shadow-sm md:hidden animate-fade-in z-20">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder={header.searchPlaceholder}
              className="w-full h-10 pl-9 pr-3 py-2 text-xs bg-[#f4f7f4] border border-[#dbe5dd] rounded-xl focus:bg-white focus:border-[#225740] outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      )}
    </header>
  );
}
