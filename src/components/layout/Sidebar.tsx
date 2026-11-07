"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  KeyRound,
  Key,
  CheckCircle2,
  CheckCircle,
  ListChecks,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  ShieldAlert,
  FileText,
  BarChart2,
  BarChart3,
  Database,
  Bell,
  HelpCircle,
  Folder,
  Lock,
  Unlock,
  Layers,
  Globe,
  MapPin,
  Sliders,
  Activity,
  FileSpreadsheet,
  Compass,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/context/auth-context";
import {
  navigationService,
  DynamicNavigationItem,
} from "@/services/navigation.service";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Normalized Lucide Icon Lookup Map
 * Allows backend to specify icon names in any casing or variation
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  layoutdashboard: LayoutDashboard,
  dashboard: LayoutDashboard,
  users: Users,
  user: User,
  keyround: KeyRound,
  key: Key,
  roles: KeyRound,
  role: KeyRound,
  permissions: KeyRound,
  checkcircle2: CheckCircle2,
  checkcircle: CheckCircle,
  requests: CheckCircle2,
  accessrequests: CheckCircle2,
  listchecks: ListChecks,
  audit: ListChecks,
  auditlogs: ListChecks,
  settings: Settings,
  security: Settings,
  securitysettings: Settings,
  shield: Shield,
  shieldalert: ShieldAlert,
  filetext: FileText,
  reports: BarChart3,
  barchart: BarChart3,
  barchart2: BarChart2,
  barchart3: BarChart3,
  database: Database,
  bell: Bell,
  helpcircle: HelpCircle,
  folder: Folder,
  lock: Lock,
  unlock: Unlock,
  layers: Layers,
  globe: Globe,
  mappin: MapPin,
  gis: MapPin,
  sliders: Sliders,
  activity: Activity,
  filespreadsheet: FileSpreadsheet,
  compass: Compass,
};

const NavIcon = ({ name }: { name: string }) => {
  const cleanKey = (name || "").toLowerCase().replace(/[-_\s]/g, "");
  const IconComponent = ICON_MAP[cleanKey] || LayoutDashboard;
  return <IconComponent className="w-4 h-4 flex-shrink-0" />;
};

const DEFAULT_SIDEBAR_ITEMS: DynamicNavigationItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", isVisible: true, isEnabled: true },
  { id: "users", label: "Users", href: "/users", icon: "Users", isVisible: true, isEnabled: true },
  { id: "roles", label: "Roles & Permissions", href: "/roles", icon: "KeyRound", isVisible: true, isEnabled: true },
  { id: "audit", label: "Audit Logs", href: "/audit", icon: "ListChecks", isVisible: true, isEnabled: true },
  { id: "settings", label: "Security Settings", href: "/settings", icon: "Settings", isVisible: true, isEnabled: true },
];

/**
 * Checks whether an item's route is considered currently active
 */
function isRouteActive(href: string, pathname: string): boolean {
  if (!href || href === "#") return false;
  if (href === "/dashboard" || href === "/") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Checks whether any child item within a tree is active
 */
function hasActiveChild(
  children: DynamicNavigationItem[] | undefined,
  pathname: string,
): boolean {
  if (!children || children.length === 0) return false;
  return children.some(
    (child) =>
      isRouteActive(child.href, pathname) ||
      hasActiveChild(child.children, pathname),
  );
}

/**
 * Individual Dynamic Navigation Item Component
 * Supports single links and nested collapsible sub-menus
 */
const DynamicSidebarItem = ({
  item,
  pathname,
  onItemClick,
}: {
  item: DynamicNavigationItem;
  pathname: string;
  onItemClick?: () => void;
}) => {
  const isEnabled = item.isEnabled !== false;
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const isSelfActive = isRouteActive(item.href, pathname);
  const childActive = hasActiveChild(item.children, pathname);
  const isActive = isSelfActive || childActive;

  // Manage collapsed/expanded state for sub-menus (auto-expand if child active)
  const [isExpanded, setIsExpanded] = useState<boolean>(childActive);

  useEffect(() => {
    if (childActive) {
      setIsExpanded(true);
    }
  }, [childActive]);

  // Render disabled state
  if (!isEnabled) {
    return (
      <div
        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white/30 cursor-not-allowed select-none"
        title="Feature disabled by administrator policy"
      >
        <div className="flex items-center gap-3">
          <NavIcon name={item.icon} />
          <span>{item.label}</span>
        </div>
        <span className="text-[10px] uppercase font-bold text-white/20">
          Disabled
        </span>
      </div>
    );
  }

  // Parent menu with nested sub-menus
  if (hasChildren && item.children) {
    return (
      <div className="space-y-1">
        <div
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            isActive
              ? "bg-[#8da882] text-[#11261c] font-bold shadow-xs"
              : "text-white/75 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Link
            href={item.href || "/settings"}
            onClick={onItemClick}
            className="flex items-center gap-3 flex-1"
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className="p-1 hover:bg-white/10 rounded-lg cursor-pointer"
            aria-label="Toggle sub-menu"
          >
            {item.badge && (
              <span
                className={`mr-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-[#11261c]/15 text-[#11261c]"
                    : "bg-[#fdeccf] text-[#8a5200]"
                }`}
              >
                {item.badge}
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="ml-4 pl-3 border-l border-white/10 space-y-1 py-1">
            {item.children.map((child) => {
              const isChildActive = isRouteActive(child.href, pathname);
              const isChildEnabled = child.isEnabled !== false;

              if (!isChildEnabled) {
                return (
                  <div
                    key={child.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-white/30 cursor-not-allowed select-none"
                  >
                    <span>{child.label}</span>
                    <span className="text-[9px] uppercase font-bold text-white/20">
                      Disabled
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={child.id}
                  href={child.href || "/dashboard"}
                  onClick={onItemClick}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isChildActive
                      ? "bg-[#8da882] text-[#11261c] font-bold shadow-xs"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {child.icon ? (
                      <NavIcon name={child.icon} />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    )}
                    <span>{child.label}</span>
                  </div>

                  {child.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        isChildActive
                          ? "bg-[#11261c]/15 text-[#11261c]"
                          : "bg-[#fdeccf] text-[#8a5200]"
                      }`}
                    >
                      {child.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Standard single navigation link
  return (
    <Link
      href={item.href || "/dashboard"}
      onClick={onItemClick}
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        isActive
          ? "bg-[#8da882] text-[#11261c] font-bold shadow-xs"
          : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <NavIcon name={item.icon} />
        <span>{item.label}</span>
      </div>

      {item.badge && (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isActive
              ? "bg-[#11261c]/15 text-[#11261c]"
              : "bg-[#fdeccf] text-[#8a5200]"
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
};

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user: authUser, accessToken, isLoading: isAuthLoading } = useAuth();

  // Dynamic backend navigation state
  const [navItems, setNavItems] = useState<DynamicNavigationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Request deduplication ref
  const isFetchingRef = useRef<boolean>(false);

  const fetchNavigation = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await navigationService.getSidebarNavigation(
        accessToken || undefined,
      );

      if (response.success && response.items && response.items.length > 0) {
        setNavItems(response.items);
      } else {
        if (response.status === 401) {
          if (isAuthLoading) {
            // Auth session still initializing; retain default items and wait for context resolution
            setNavItems(DEFAULT_SIDEBAR_ITEMS);
            return;
          }
          // Session expired or unauthorized
          setError("Session expired. Please log in again.");
          router.push("/login?error=session_expired");
          return;
        }

        if (response.status === 403) {
          setError("Insufficient permissions to view navigation.");
          setNavItems([]);
          return;
        }

        // Fallback to default items if backend items are empty or route is not available
        setNavItems(DEFAULT_SIDEBAR_ITEMS);
      }
    } catch {
      setNavItems(DEFAULT_SIDEBAR_ITEMS);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [accessToken, router, isAuthLoading]);

  // Fetch navigation on mount and re-fetch when session/user identity changes
  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!isMounted) return;
      await fetchNavigation();
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [fetchNavigation, authUser?.email]);

  const displayUser = authUser
    ? {
        name: authUser.name,
        role: authUser.role,
        initials:
          authUser.initials ||
          (authUser.name
            ? authUser.name
                .split(" ")
                .filter(Boolean)
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : authUser.email
              ? authUser.email[0].toUpperCase()
              : "U"),
      }
    : {
        name: "",
        role: "",
        initials: "--",
      };

  const help = {
    title: "Need a hand?",
    description: "Visit the help center for account and access support.",
    buttonText: "Open help center →",
  };

  const handleSignOut = async () => {
    console.log("[Sidebar] signing out user");
    try {
      await logout();
    } catch {
      router.push("/login");
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-fade-in"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#11261c] text-white flex flex-col justify-between p-4 sm:p-5 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar custom-sidebar-scroll">
          <div className="flex items-center justify-between pb-6 border-b border-white/10 flex-shrink-0">
            <Logo light href="/dashboard" />
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-white/70 hover:text-white md:hidden transition-colors cursor-pointer"
              aria-label="Close Mobile Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav
            className="mt-6 space-y-1.5 flex-1"
            aria-label="Sidebar Navigation"
          >
            {/* Loading Skeleton */}
            {isLoading && (
              <div
                className="space-y-2 animate-pulse"
                aria-label="Loading Navigation"
              >
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5"
                  >
                    <div className="w-4 h-4 rounded bg-white/10 flex-shrink-0" />
                    <div
                      className="h-3 rounded bg-white/10"
                      style={{ width: `${55 + (idx % 3) * 15}%` }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-white/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-red-300 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Navigation Error</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => fetchNavigation()}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#8da882] hover:text-white transition-colors cursor-pointer pt-1"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && navItems.length === 0 && (
              <div className="px-3.5 py-5 text-center rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs">
                No navigation items available
              </div>
            )}

            {/* 100% Backend-Driven Navigation Items */}
            {!isLoading &&
              !error &&
              navItems.map((item) => (
                <DynamicSidebarItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  onItemClick={() => onCloseMobile?.()}
                />
              ))}
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10 flex-shrink-0">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="text-xs font-bold text-white mb-1">{help.title}</h4>
            <p className="text-[11px] text-white/70 leading-relaxed mb-3">
              {help.description}
            </p>
            <button
              type="button"
              onClick={() =>
                alert(
                  "IntraShip Support: Help desk ticket submission opens in admin portal.",
                )
              }
              className="w-full py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              {help.buttonText}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#225740] text-white flex items-center justify-center font-bold text-xs border border-white/20">
                {displayUser.initials}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  {displayUser.name || "User"}
                </span>
                <span className="text-[10px] text-white/60 leading-tight">
                  {displayUser.role || "Administrator"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
