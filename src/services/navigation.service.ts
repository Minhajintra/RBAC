import { apiClient } from "@/lib/api-client";

export interface DynamicNavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string;
  isActive?: boolean;
  isEnabled?: boolean;
  isVisible?: boolean;
  order?: number;
  children?: DynamicNavigationItem[];
  [key: string]: unknown;
}

export interface SidebarNavigationResponse {
  success: boolean;
  items: DynamicNavigationItem[];
  status?: number;
  message?: string;
  error?: string;
}

export const NAVIGATION_ROUTES = {
  SIDEBAR: "/api/v1/navigation/sidebar",
} as const;

/**
 * Normalizes a raw backend navigation item into a standard DynamicNavigationItem
 */
function normalizeItem(raw: unknown): DynamicNavigationItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const id = String(
    item.id ??
      item.key ??
      item.code ??
      item.route ??
      item.path ??
      item.href ??
      item.label ??
      item.title ??
      item.name ??
      "",
  ).trim();

  const label = String(
    item.label ?? item.title ?? item.name ?? id ?? "",
  ).trim();

  const rawHref = String(
    item.href ?? item.path ?? item.route ?? item.url ?? "",
  ).trim();

  // Ensure safe route format: internal paths must start with "/" unless empty or "#"
  let href = rawHref;
  if (
    href &&
    !href.startsWith("/") &&
    !href.startsWith("#") &&
    !href.startsWith("http")
  ) {
    href = `/${href}`;
  }

  // Security check: prevent javascript:, data:, or unsafe schemes
  if (/^(javascript|data|vbscript):/i.test(href)) {
    href = "#";
  }

  // Intelligently map known core frontend routes so links never break
  const normLabel = label.toLowerCase().replace(/[-_\s]+/g, " ");
  const normId = id.toLowerCase().replace(/[-_\s]+/g, " ");

  if (
    normLabel.includes("setting") ||
    normId.includes("setting") ||
    normLabel.includes("security") ||
    id === "29fcfc0e-bcb3-4105-97cc-df39a20508d0" ||
    href === "/system-settings" ||
    href === "/security-settings"
  ) {
    href = "/settings";
  } else if (
    normLabel.includes("audit") ||
    normId.includes("audit") ||
    id === "a7eaa459-9255-468d-8630-5d0e9237589b"
  ) {
    href = "/audit";
  } else if (
    normLabel.includes("role") ||
    normId.includes("role") ||
    id === "968d3044-da03-4104-990e-8a5dac92f7ae"
  ) {
    href = "/roles";
  } else if (
    normLabel.includes("user") ||
    normId.includes("user") ||
    id === "899918c3-c8be-43be-a76b-75d07642b879"
  ) {
    href = "/users";
  } else if (
    normLabel.includes("dashboard") ||
    normId.includes("dashboard") ||
    id === "afbf3068-55b3-462e-bc6d-70f2505e0ad2"
  ) {
    href = "/dashboard";
  }

  const icon = String(
    item.icon ?? item.icon_name ?? item.iconType ?? "LayoutDashboard",
  ).trim();

  let badge: string | undefined = undefined;
  if (item.badge != null && item.badge !== "") {
    badge = String(item.badge);
  } else if (item.count != null && item.count !== "") {
    badge = String(item.count);
  } else if (item.tag != null && item.tag !== "") {
    badge = String(item.tag);
  }

  const isVisible = item.is_visible !== false && item.visible !== false;
  const isEnabled = item.is_enabled !== false && item.enabled !== false;
  const isActive = Boolean(item.is_active || item.active);

  const order =
    typeof item.order === "number"
      ? item.order
      : typeof item.ordering === "number"
        ? item.ordering
        : undefined;

  // Process nested children if present
  const rawChildren = Array.isArray(item.children)
    ? item.children
    : Array.isArray(item.sub_items)
      ? item.sub_items
      : Array.isArray(item.subItems)
        ? item.subItems
        : Array.isArray(item.items)
          ? item.items
          : undefined;

  const children = rawChildren
    ? (rawChildren
        .map((c) => normalizeItem(c))
        .filter(
          (c): c is DynamicNavigationItem => c !== null && c.isVisible !== false,
        )
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)))
    : undefined;

  return {
    id: id || label.toLowerCase().replace(/\s+/g, "-"),
    label,
    icon,
    href: href || (children && children.length > 0 ? "" : "/dashboard"),
    badge,
    isActive,
    isEnabled,
    isVisible,
    order,
    children: children && children.length > 0 ? children : undefined,
  };
}

/**
 * Extracts and sorts navigation items from any standard backend envelope
 */
export function extractNavigationItems(raw: unknown): DynamicNavigationItem[] {
  let list: unknown[] = [];

  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      list = obj.data;
    } else if (obj.data && typeof obj.data === "object") {
      const dataObj = obj.data as Record<string, unknown>;
      if (Array.isArray(dataObj.items)) list = dataObj.items;
      else if (Array.isArray(dataObj.navigation)) list = dataObj.navigation;
      else if (Array.isArray(dataObj.sidebar)) list = dataObj.sidebar;
      else if (Array.isArray(dataObj.menus)) list = dataObj.menus;
      else if (Array.isArray(dataObj.links)) list = dataObj.links;
    } else if (Array.isArray(obj.items)) {
      list = obj.items;
    } else if (Array.isArray(obj.navigation)) {
      list = obj.navigation;
    } else if (Array.isArray(obj.sidebar)) {
      list = obj.sidebar;
    }
  }

  return list
    .map((item) => normalizeItem(item))
    .filter(
      (item): item is DynamicNavigationItem =>
        item !== null && item.isVisible !== false,
    )
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export const navigationService = {
  /**
   * Fetches sidebar navigation items strictly from backend API GET /api/v1/navigation/sidebar.
   * Seamlessly operates in both client-side and server-side contexts.
   */
  async getSidebarNavigation(token?: string): Promise<SidebarNavigationResponse> {
    try {
      let raw: unknown;

      if (typeof window !== "undefined") {
        // Client environment: query internal route proxy or apiClient
        const headers: Record<string, string> = {
          Accept: "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token.replace(/^Bearer\s+/i, "")}`;
        }

        const res = await fetch(NAVIGATION_ROUTES.SIDEBAR, {
          method: "GET",
          headers,
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg =
            (errData as { message?: string; detail?: string })?.message ||
            (errData as { message?: string; detail?: string })?.detail ||
            `HTTP ${res.status}`;
          return {
            success: false,
            items: [],
            status: res.status,
            error: errMsg,
          };
        }

        raw = await res.json();
      } else {
        // Server environment: directly call backend using centralized apiClient
        const config: Record<string, unknown> = {};
        if (token) {
          config.headers = {
            Authorization: `Bearer ${token.replace(/^Bearer\s+/i, "")}`,
          };
        }
        raw = await apiClient.get<Record<string, unknown>>(
          NAVIGATION_ROUTES.SIDEBAR,
          config,
        );
      }

      const items = extractNavigationItems(raw);

      return {
        success: true,
        items,
        status: 200,
      };
    } catch (err: unknown) {
      const errObj = err as {
        status?: number;
        response?: { status?: number; data?: { message?: string; detail?: string } };
        message?: string;
      };
      const status =
        errObj.status ||
        errObj.response?.status ||
        500;
      const errorMsg =
        errObj.response?.data?.message ||
        errObj.response?.data?.detail ||
        errObj.message ||
        "Failed to load navigation";

      return {
        success: false,
        items: [],
        status,
        error: errorMsg,
      };
    }
  },
};

