"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  AlertTriangle,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { RoleItem, RolePermissionEntry } from "../types/role.types";
import { usePermissions } from "@/context/permission-context";
import { useAuth } from "@/context/auth-context";
import { saveRole, getRolePermissions, getRoleRawPermissions, deleteRole } from "../actions/saveRole";
import { getRolesAction } from "../actions/roles";
import { DEFAULT_NAV_MAP, isUuid, matchesResource } from "../utils/roleMatrix.utils";

export interface InterfacePermissionRow {
  id: string;
  permission_id?: string;
  key: string;
  name: string;
  description: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

const DEFAULT_INTERFACE_ROWS: Array<{
  id: string;
  key: string;
  name: string;
  description: string;
}> = [
  {
    id: "afbf3068-55b3-462e-bc6d-70f2505e0ad2",
    key: "dashboard",
    name: "Dashboard",
    description: "System overview, analytics and activity monitoring",
  },
  {
    id: "899918c3-c8be-43be-a76b-75d07642b879",
    key: "users",
    name: "Users",
    description: "User directory, invitations, and profile management",
  },
  {
    id: "968d3044-da03-4104-990e-8a5dac92f7ae",
    key: "roles",
    name: "Roles & Permissions",
    description: "Role definitions, access policies, and permission matrix",
  },
  {
    id: "a7eaa459-9255-468d-8630-5d0e9237589b",
    key: "audit",
    name: "Audit Logs",
    description: "Security tracking, audit events, and CSV export",
  },
  {
    id: "29fcfc0e-bcb3-4105-97cc-df39a20508d0",
    key: "settings",
    name: "Security Settings",
    description: "Password policies, MFA configuration, and workspace preferences",
  },
];

function initializeInterfacePermissions(role?: RoleItem | null): InterfacePermissionRow[] {
  const map = new Map<string, InterfacePermissionRow>();
  for (const item of DEFAULT_INTERFACE_ROWS) {
    map.set(item.key.toLowerCase(), {
      id: item.id,
      permission_id: undefined,
      key: item.key,
      name: item.name,
      description: item.description,
      read: false,
      create: false,
      update: false,
      delete: false,
    });
  }

  if (!role) return Array.from(map.values());

  // 1. Direct match from raw backend permissions (using exact nav_id and permission_id)
  const rawList =
    (role.raw_permissions as Record<string, unknown>[]) ||
    (role.permissions as unknown as Record<string, unknown>[]) ||
    [];

  if (Array.isArray(rawList) && rawList.length > 0) {
    for (const p of rawList) {
      const pNavId = String(p.nav_id || p.id || "").trim().toLowerCase();
      const pPermId = String(p.permission_id || "").trim();

      for (const item of map.values()) {
        const itemNavId = item.id.toLowerCase();
        if (pNavId && (itemNavId === pNavId || pNavId.includes(itemNavId))) {
          if (pPermId) item.permission_id = pPermId;
          item.read = Boolean(p.read ?? p.view ?? p.can_read);
          item.create = Boolean(p.create ?? p.edit ?? p.can_create);
          item.update = Boolean(p.update ?? p.can_update);
          item.delete = Boolean(p.delete ?? p.can_delete);
        }
      }
    }
  }

  // 2. Populate from role.matrix if available
  if (role?.matrix && role.matrix.length > 0) {
    for (const m of role.matrix) {
      const rawRes = (m.resource || "").trim();
      if (!rawRes) continue;
      const lower = rawRes.toLowerCase();

      let foundKey: string | null = null;
      for (const [key, iface] of map.entries()) {
        if (
          lower === key ||
          lower.includes(key) ||
          iface.name.toLowerCase() === lower ||
          matchesResource(rawRes, key)
        ) {
          foundKey = key;
          break;
        }
      }

      if (foundKey) {
        const item = map.get(foundKey)!;
        // Only override if not already populated from raw permissions
        if (!item.read && !item.create && !item.update && !item.delete) {
          item.read = Boolean(m.view);
          item.create = Boolean(m.edit);
          item.update = Boolean(m.update);
          item.delete = Boolean(m.delete);
        }
        if (m.description) item.description = m.description;
      }
    }
  }

  // 3. Check role.permissions names
  if (role?.permissions && role.permissions.length > 0) {
    for (const p of role.permissions) {
      const pName = (p.name || "").trim().toLowerCase();
      const dotIndex = pName.indexOf(".");
      const base = dotIndex > 0 ? pName.slice(0, dotIndex) : pName;
      const suffix = dotIndex > 0 ? pName.slice(dotIndex + 1) : "";

      for (const [key, item] of map.entries()) {
        if (
          base === key ||
          base.includes(key) ||
          item.name.toLowerCase().includes(base) ||
          item.id.toLowerCase() === base
        ) {
          const pType = (p.type || "").toLowerCase();
          if (pType === "view" || suffix === "view" || suffix === "read") item.read = true;
          if (pType === "create" || suffix === "create") item.create = true;
          if (pType === "update" || pType === "edit" || suffix === "update" || suffix === "edit") item.update = true;
          if (pType === "delete" || suffix === "delete") item.delete = true;
        }
      }
    }
  }

  return Array.from(map.values());
}

function convertInterfacePermissionsToEntries(
  rows: InterfacePermissionRow[],
): RolePermissionEntry[] {
  const result: RolePermissionEntry[] = [];
  for (const row of rows) {
    if (row.read) {
      result.push({
        name: `${row.name}.view`,
        type: "View",
        description: `View ${row.name}`,
      });
    }
    if (row.create) {
      result.push({
        name: `${row.name}.create`,
        type: "Create",
        description: `Create ${row.name}`,
      });
    }
    if (row.update) {
      result.push({
        name: `${row.name}.update`,
        type: "Update",
        description: `Update ${row.name}`,
      });
    }
    if (row.delete) {
      result.push({
        name: `${row.name}.delete`,
        type: "Delete",
        description: `Delete ${row.name}`,
      });
    }
  }
  return result;
}

interface CreateEditRoleViewProps {
  initialRoles?: RoleItem[];
  initialSelectedRoleId?: string;
}

export default function CreateEditRoleView({
  initialRoles = [],
  initialSelectedRoleId,
}: CreateEditRoleViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawIdFromUrl = searchParams.get("id") || initialSelectedRoleId;
  const initialMode = searchParams.get("mode");

  const { can } = usePermissions();
  const { user } = useAuth();

  const canCreateRole = can("roles", "create");
  const canUpdateRole = can("roles", "update");
  const canDeleteRole = can("roles", "delete");

  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Active view tab: Side-by-Side, Create Role, Edit Role, Delete Role - strictly respecting backend permissions
  const [activeTab, setActiveTab] = useState<"both" | "create" | "edit" | "delete">(() => {
    if (initialMode === "create" && canCreateRole) return "create";
    if (initialMode === "edit" && canUpdateRole) return "edit";
    if (initialMode === "delete" && canDeleteRole) return "delete";
    if (canCreateRole && canUpdateRole) return "both";
    if (canUpdateRole) return "edit";
    if (canCreateRole) return "create";
    return "edit";
  });

  // Sync mode from URL searchParams respecting permissions
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "create" && canCreateRole) {
      setActiveTab("create");
    } else if (mode === "edit" && canUpdateRole) {
      setActiveTab("edit");
    } else if (mode === "delete" && canDeleteRole) {
      setActiveTab("delete");
    } else if (mode === "both" && canCreateRole && canUpdateRole) {
      setActiveTab("both");
    } else {
      if (!canCreateRole && canUpdateRole) {
        setActiveTab("edit");
      }
    }
  }, [searchParams, canCreateRole, canUpdateRole, canDeleteRole]);

  // If roles were not passed or empty from SSR, dynamically load from backend API
  useEffect(() => {
    if (roles.length === 0) {
      setIsLoadingRoles(true);
      getRolesAction()
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setRoles(fetched);
          }
        })
        .finally(() => {
          setIsLoadingRoles(false);
        });
    }
  }, [roles.length]);

  // Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ----------------------------------------------------
  // CREATE ROLE STATE
  // ----------------------------------------------------
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createInterfacePermissions, setCreateInterfacePermissions] = useState<
    InterfacePermissionRow[]
  >(() =>
    DEFAULT_INTERFACE_ROWS.map((r) => ({
      ...r,
      read: true,
      create: false,
      update: false,
      delete: false,
    })),
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleCreatePermission = (
    interfaceId: string,
    action: "read" | "create" | "update" | "delete",
    checked: boolean,
  ) => {
    setCreateInterfacePermissions((prev) =>
      prev.map((row) =>
        row.id === interfaceId ? { ...row, [action]: checked } : row,
      ),
    );
  };

  const handleToggleAllCreatePermissions = (enable: boolean) => {
    setCreateInterfacePermissions((prev) =>
      prev.map((row) => ({
        ...row,
        read: enable,
        create: enable,
        update: enable,
        delete: enable,
      })),
    );
  };

  const handleSubmitCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast("Please enter a role name.", "error");
      return;
    }

    setIsCreating(true);
    try {
      const permissions = convertInterfacePermissionsToEntries(
        createInterfacePermissions,
      );
      const interfacePermissionsPayload = createInterfacePermissions.map((row) => ({
        nav_id: row.id,
        read: Boolean(row.read),
        view: Boolean(row.read),
        create: Boolean(row.create),
        edit: Boolean(row.create),
        update: Boolean(row.update),
        delete: Boolean(row.delete),
        name: row.name,
      }));

      const res = await saveRole({
        name: createName.trim(),
        description: createDesc.trim(),
        permissions,
        interface_permissions: interfacePermissionsPayload,
      });

      if (res.success) {
        showToast(res.message, "success");
        getRolesAction().then((fresh) => {
          if (fresh && fresh.length > 0) setRoles(fresh);
        });
        router.refresh();
        setTimeout(() => {
          router.push("/roles");
        }, 1200);
      } else {
        showToast(res.message || "Failed to create role.", "error");
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showToast(errObj?.message || "Error creating role on backend API.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // ----------------------------------------------------
  // EDIT ROLE STATE (Driven strictly from real backend roles)
  // ----------------------------------------------------
  const defaultEditRole =
    roles.find((r) => String(r.id) === String(rawIdFromUrl) || r.name.toLowerCase() === String(rawIdFromUrl).toLowerCase()) ||
    roles[0] ||
    null;

  const [editRoleId, setEditRoleId] = useState<string | number>(defaultEditRole?.id || "");
  const [editName, setEditName] = useState(defaultEditRole?.name || "");
  const [editDesc, setEditDesc] = useState(defaultEditRole?.description || "");
  const [editInterfacePermissions, setEditInterfacePermissions] = useState<
    InterfacePermissionRow[]
  >(() => initializeInterfacePermissions(defaultEditRole));
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state if selected role changes or on initial mount
  useEffect(() => {
    if (defaultEditRole) {
      if (!editRoleId) {
        setEditRoleId(defaultEditRole.id);
        setEditName(defaultEditRole.name);
        setEditDesc(defaultEditRole.description);
        setEditInterfacePermissions(initializeInterfacePermissions(defaultEditRole));
      }

      const hasAnyChecked = editInterfacePermissions.some(
        (r) => r.read || r.create || r.update || r.delete,
      );
      if (!hasAnyChecked && defaultEditRole.id) {
        getRoleRawPermissions(defaultEditRole.id).then((rawPerms) => {
          if (rawPerms && rawPerms.length > 0) {
            const roleWithRaw: RoleItem = {
              ...defaultEditRole,
              raw_permissions: rawPerms as unknown as Record<string, unknown>[],
            };
            setEditInterfacePermissions(initializeInterfacePermissions(roleWithRaw));
          }
        });
      }
    }
  }, [defaultEditRole, editRoleId]);

  // When changing which role to edit
  const handleSelectRoleToEdit = async (id: string | number) => {
    setEditRoleId(id);
    const target = roles.find((r) => String(r.id) === String(id));
    if (target) {
      setEditName(target.name);
      setEditDesc(target.description);

      // Check if permissions need to be loaded from backend API
      if (target.raw_permissions && target.raw_permissions.length > 0) {
        setEditInterfacePermissions(initializeInterfacePermissions(target));
      } else {
        const rawPerms = await getRoleRawPermissions(id).catch(() => []);
        if (rawPerms && rawPerms.length > 0) {
          const roleWithRaw: RoleItem = {
            ...target,
            raw_permissions: rawPerms as unknown as Record<string, unknown>[],
          };
          setEditInterfacePermissions(initializeInterfacePermissions(roleWithRaw));
        } else {
          const fetchedPerms = await getRolePermissions(id).catch(() => []);
          const roleWithPerms: RoleItem = {
            ...target,
            permissions: fetchedPerms,
          };
          setEditInterfacePermissions(initializeInterfacePermissions(roleWithPerms));
        }
      }
    }
  };

  const handleToggleEditPermission = (
    interfaceId: string,
    action: "read" | "create" | "update" | "delete",
    checked: boolean,
  ) => {
    setEditInterfacePermissions((prev) =>
      prev.map((row) =>
        row.id === interfaceId ? { ...row, [action]: checked } : row,
      ),
    );
  };

  const handleToggleAllEditPermissions = (enable: boolean) => {
    setEditInterfacePermissions((prev) =>
      prev.map((row) => ({
        ...row,
        read: enable,
        create: enable,
        update: enable,
        delete: enable,
      })),
    );
  };

  const handleSubmitEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast("Please enter a role name.", "error");
      return;
    }
    if (!editRoleId) {
      showToast("No role selected to edit.", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const permissions = convertInterfacePermissionsToEntries(
        editInterfacePermissions,
      );
      const interfacePermissionsPayload = editInterfacePermissions.map((row) => ({
        permission_id: row.permission_id,
        nav_id: row.id,
        read: Boolean(row.read),
        view: Boolean(row.read),
        create: Boolean(row.create),
        edit: Boolean(row.create),
        update: Boolean(row.update),
        delete: Boolean(row.delete),
        name: row.name,
      }));

      const res = await saveRole(
        {
          name: editName.trim(),
          description: editDesc.trim(),
          permissions,
          interface_permissions: interfacePermissionsPayload,
        },
        editRoleId,
      );

      if (res.success) {
        showToast(res.message, "success");
        getRolesAction().then((fresh) => {
          if (fresh && fresh.length > 0) setRoles(fresh);
        });
        router.refresh();
        setTimeout(() => {
          router.push("/roles");
        }, 1200);
      } else {
        showToast(res.message || "Failed to update role.", "error");
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showToast(errObj?.message || "Error updating role on backend API.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ----------------------------------------------------
  // DELETE ROLE STATE & HANDLERS
  // ----------------------------------------------------
  const [deleteRoleId, setDeleteRoleId] = useState<string | number>(
    defaultEditRole?.id || roles[0]?.id || "",
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedDeleteRole = useMemo(() => {
    return (
      roles.find(
        (r) =>
          String(r.id) === String(deleteRoleId) ||
          r.name.toLowerCase() === String(deleteRoleId).toLowerCase(),
      ) ||
      roles[0] ||
      null
    );
  }, [roles, deleteRoleId]);

  const handleSelectRoleToDelete = (id: string | number) => {
    setDeleteRoleId(id);
  };

  const handleExecuteDelete = async () => {
    if (!selectedDeleteRole) return;
    if (selectedDeleteRole.is_default || selectedDeleteRole.name.toLowerCase().includes("super admin")) {
      showToast("Default system roles cannot be deleted.", "error");
      setShowConfirmModal(false);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteRole(selectedDeleteRole.id);
      if (res.success) {
        showToast(res.message || `Role "${selectedDeleteRole.name}" deleted successfully.`, "success");
        const remaining = roles.filter((r) => String(r.id) !== String(selectedDeleteRole.id));
        setRoles(remaining);
        if (remaining.length > 0) {
          setDeleteRoleId(remaining[0].id);
          setEditRoleId(remaining[0].id);
          setEditName(remaining[0].name);
          setEditDesc(remaining[0].description);
        } else {
          setDeleteRoleId("");
          setEditRoleId("");
        }
        setShowConfirmModal(false);
        setTimeout(() => {
          router.push("/roles");
        }, 1200);
      } else {
        showToast(res.message || "Failed to delete role.", "error");
        setShowConfirmModal(false);
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showToast(errObj?.message || "Error deleting role on backend API.", "error");
      setShowConfirmModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-4 sm:right-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-[#10281d] text-white border-[#225740]"
              : "bg-red-800 text-white border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4 text-[#8da882]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-200" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal for Delete Role */}
      {showConfirmModal && selectedDeleteRole && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#d1ded6] p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#10281d]">Delete Role</h3>
                <p className="text-xs text-[#6b7c72]">Confirm permanent role removal</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#4a5e52] leading-relaxed">
              Are you sure you want to permanently delete role{" "}
              <strong className="text-[#10281d]">&ldquo;{selectedDeleteRole.name}&rdquo;</strong>?
              This will remove all associated permission mappings.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f4f1]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-[#10281d] bg-white border border-[#d1ded6] hover:bg-[#f4f7f4] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#10281d] tracking-tight leading-tight">
            Roles & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7c72] mt-1">
            Define who can do what, with clear and consistent access policies.
          </p>
        </div>

        {/* View Switcher Tabs: Side-by-Side, Create Role, Edit Role, Delete Role */}
        <div className="inline-flex items-center p-1 bg-white border border-[#d1ded6] rounded-xl self-start sm:self-auto shadow-2xs">
          {canCreateRole && canUpdateRole && (
            <button
              type="button"
              onClick={() => setActiveTab("both")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "both"
                  ? "bg-[#10281d] text-white shadow-2xs"
                  : "text-[#6b7c72] hover:text-[#10281d]"
              }`}
            >
              Side-by-Side
            </button>
          )}
          {canCreateRole && (
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "create"
                  ? "bg-[#10281d] text-white shadow-2xs"
                  : "text-[#6b7c72] hover:text-[#10281d]"
              }`}
            >
              Create Role
            </button>
          )}
          {canUpdateRole && (
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "edit"
                  ? "bg-[#10281d] text-white shadow-2xs"
                  : "text-[#6b7c72] hover:text-[#10281d]"
              }`}
            >
              Edit Role
            </button>
          )}
          {canDeleteRole && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("delete");
                if (editRoleId) setDeleteRoleId(editRoleId);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "delete"
                  ? "bg-red-700 text-white shadow-2xs"
                  : "text-[#6b7c72] hover:text-red-700"
              }`}
            >
              Delete Role
            </button>
          )}
        </div>
      </div>

      {!canCreateRole && !canUpdateRole ? (
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-8 sm:p-12 text-center shadow-xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#eef5f0] text-[#225740] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#10281d]">
            Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-[#6b7c72] mt-1 mb-6">
            Your role does not have permission to create or edit roles in this workspace. Please contact an administrator.
          </p>
          <button
            type="button"
            onClick={() => router.push("/roles")}
            className="px-5 py-2.5 bg-[#10281d] hover:bg-[#16382b] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Back to Roles
          </button>
        </div>
      ) : (
        /* Main Container - Side by Side on Desktop */
        <div
          className={`grid gap-6 items-start ${
            activeTab === "both"
              ? "grid-cols-1 xl:grid-cols-2"
              : "grid-cols-1 max-w-3xl mx-auto"
          }`}
        >
          {/* ======================================================== */}
          {/* CARD 1: CREATE ROLE */}
          {/* ======================================================== */}
          {canCreateRole && (activeTab === "both" || activeTab === "create") && (
          <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              {/* Card Header with circular back button */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#f0f4f1]">
                <button
                  type="button"
                  onClick={() => router.push("/roles")}
                  aria-label="Back to Roles"
                  className="w-9 h-9 rounded-full bg-[#eaf1ec] hover:bg-[#dbe7de] text-[#10281d] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#10281d]">
                    Create Role
                  </h2>
                  <p className="text-xs text-[#6b7c72] mt-0.5">
                    Define a new role and assign permissions.
                  </p>
                </div>
              </div>

              {/* Role Information Section */}
              <div className="mt-5">
                <h3 className="text-sm font-bold text-[#10281d]">
                  Role Information
                </h3>

                {/* Role Name */}
                <div className="mt-3">
                  <label
                    htmlFor="create-role-name"
                    className="block text-xs font-semibold text-[#10281d] mb-1.5"
                  >
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="create-role-name"
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g., Manager"
                    maxLength={50}
                    className="w-full h-10 px-3.5 py-2 bg-white border border-[#d1ded6] text-xs sm:text-sm rounded-xl text-[#10281d] placeholder:text-gray-400 focus:outline-none focus:border-[#225740] focus:ring-1 focus:ring-[#225740] transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="mt-3.5">
                  <label
                    htmlFor="create-role-desc"
                    className="block text-xs font-semibold text-[#10281d] mb-1.5"
                  >
                    Description
                  </label>
                  <textarea
                    id="create-role-desc"
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="Briefly describe the role and its purpose..."
                    rows={3}
                    maxLength={250}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#d1ded6] text-xs sm:text-sm rounded-xl text-[#10281d] placeholder:text-gray-400 focus:outline-none focus:border-[#225740] focus:ring-1 focus:ring-[#225740] transition-colors resize-none"
                  />
                  <div className="text-[11px] text-[#8e9f95] text-right mt-1">
                    {createDesc.length} / 250
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="mt-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#10281d]">
                      Permissions
                    </h3>
                    <p className="text-xs text-[#6b7c72] mt-0.5">
                      Configure access permissions for each interface.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAllCreatePermissions(true)}
                      className="text-[11px] font-semibold text-[#225740] hover:text-[#10281d] px-2.5 py-1 rounded-lg bg-[#eef5f0] hover:bg-[#e2ede5] transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllCreatePermissions(false)}
                      className="text-[11px] font-semibold text-[#6b7c72] hover:text-[#10281d] px-2.5 py-1 rounded-lg border border-[#d1ded6] hover:bg-[#f4f7f4] transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Permissions Checkbox Matrix Table */}
                <div className="overflow-x-auto border border-[#e5ebe7] rounded-xl shadow-2xs">
                  <table className="w-full text-left border-collapse min-w-[480px]">
                    <thead>
                      <tr className="bg-[#ebf1ed] text-[#4a5e52] text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4 rounded-tl-xl">
                          Interface / Screen
                        </th>
                        <th className="py-2.5 px-3 text-center w-20">
                          Read
                        </th>
                        <th className="py-2.5 px-3 text-center w-20">
                          Create
                        </th>
                        <th className="py-2.5 px-3 text-center w-20">
                          Update
                        </th>
                        <th className="py-2.5 px-4 text-center w-20 rounded-tr-xl">
                          Delete
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f1] text-xs bg-white">
                      {createInterfacePermissions.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-[#fafcfa] transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#10281d] block text-xs sm:text-sm">
                              {row.name}
                            </span>
                            <span className="text-[#6b7c72] text-[11px] block mt-0.5">
                              {row.description}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.read}
                                onChange={(e) =>
                                  handleToggleCreatePermission(
                                    row.id,
                                    "read",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded border-[#d1ded6] text-[#225740] focus:ring-[#225740] accent-[#225740] cursor-pointer"
                                aria-label={`Read permission for ${row.name}`}
                              />
                            </label>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.create}
                                onChange={(e) =>
                                  handleToggleCreatePermission(
                                    row.id,
                                    "create",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded border-[#d1ded6] text-[#225740] focus:ring-[#225740] accent-[#225740] cursor-pointer"
                                aria-label={`Create permission for ${row.name}`}
                              />
                            </label>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.update}
                                onChange={(e) =>
                                  handleToggleCreatePermission(
                                    row.id,
                                    "update",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded border-[#d1ded6] text-[#225740] focus:ring-[#225740] accent-[#225740] cursor-pointer"
                                aria-label={`Update permission for ${row.name}`}
                              />
                            </label>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.delete}
                                onChange={(e) =>
                                  handleToggleCreatePermission(
                                    row.id,
                                    "delete",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded border-[#d1ded6] text-[#225740] focus:ring-[#225740] accent-[#225740] cursor-pointer"
                                aria-label={`Delete permission for ${row.name}`}
                              />
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[#f0f4f1]">
              <button
                type="button"
                onClick={() => router.push("/roles")}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-[#10281d] bg-white border border-[#d1ded6] hover:bg-[#f4f7f4] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitCreateRole}
                disabled={isCreating}
                className="inline-flex items-center justify-center px-6 py-2 bg-[#10281d] hover:bg-[#16382b] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Role"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CARD 2: EDIT ROLE (Only populated from real Backend Roles) */}
        {/* ======================================================== */}
        {canUpdateRole && (activeTab === "both" || activeTab === "edit") && (
          <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              {/* Card Header with circular back button and role selector */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f0f4f1]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/roles")}
                    aria-label="Back to Roles"
                    className="w-9 h-9 rounded-full bg-[#eaf1ec] hover:bg-[#dbe7de] text-[#10281d] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#10281d]">
                      Edit Role
                    </h2>
                    <p className="text-xs text-[#6b7c72] mt-0.5">
                      Update role details and permissions.
                    </p>
                  </div>
                </div>

                {/* Role Switcher dropdown from real backend roles */}
                <div>
                  {roles.length > 0 ? (
                    <select
                      value={String(editRoleId)}
                      onChange={(e) => handleSelectRoleToEdit(e.target.value)}
                      className="h-8 px-2.5 bg-[#f4f7f4] border border-[#d1ded6] rounded-lg text-xs font-medium text-[#10281d] focus:outline-none focus:border-[#225740] cursor-pointer"
                    >
                      {roles.map((r) => (
                        <option key={String(r.id)} value={String(r.id)}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-[#6b7c72]">No roles in DB</span>
                  )}
                </div>
              </div>

              {roles.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6b7c72]">
                  No existing roles found in backend database to edit. Please create a role first.
                </div>
              ) : (
                <>
                  {/* Role Information Section */}
                  <div className="mt-5">
                    <h3 className="text-sm font-bold text-[#10281d]">
                      Role Information
                    </h3>

                    {/* Role Name */}
                    <div className="mt-3">
                      <label
                        htmlFor="edit-role-name"
                        className="block text-xs font-semibold text-[#10281d] mb-1.5"
                      >
                        Role Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="edit-role-name"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Role name"
                        maxLength={50}
                        className="w-full h-10 px-3.5 py-2 bg-white border border-[#d1ded6] text-xs sm:text-sm rounded-xl text-[#10281d] placeholder:text-gray-400 focus:outline-none focus:border-[#225740] focus:ring-1 focus:ring-[#225740] transition-colors"
                      />
                    </div>

                    {/* Description */}
                    <div className="mt-3.5">
                      <label
                        htmlFor="edit-role-desc"
                        className="block text-xs font-semibold text-[#10281d] mb-1.5"
                      >
                        Description
                      </label>
                      <textarea
                        id="edit-role-desc"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Briefly describe the role and its purpose..."
                        rows={3}
                        maxLength={250}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#d1ded6] text-xs sm:text-sm rounded-xl text-[#10281d] placeholder:text-gray-400 focus:outline-none focus:border-[#225740] focus:ring-1 focus:ring-[#225740] transition-colors resize-none"
                      />
                      <div className="text-[11px] text-[#8e9f95] text-right mt-1">
                        {editDesc.length} / 250
                      </div>
                    </div>
                  </div>

                  {/* Permissions Section */}
                  <div className="mt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#10281d]">
                          Permissions
                        </h3>
                        <p className="text-xs text-[#6b7c72] mt-0.5">
                          Manage permissions for this role across each interface.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAllEditPermissions(true)}
                          className="text-[11px] font-semibold text-[#225740] hover:text-[#10281d] px-2.5 py-1 rounded-lg bg-[#eef5f0] hover:bg-[#e2ede5] transition-colors cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAllEditPermissions(false)}
                          className="text-[11px] font-semibold text-[#6b7c72] hover:text-[#10281d] px-2.5 py-1 rounded-lg border border-[#d1ded6] hover:bg-[#f4f7f4] transition-colors cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Permissions Checkbox Matrix Table */}
                    <div className="overflow-x-auto border border-[#e5ebe7] rounded-xl shadow-2xs">
                      <table className="w-full text-left border-collapse min-w-[480px]">
                        <thead>
                          <tr className="bg-[#ebf1ed] text-[#4a5e52] text-[11px] font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-4 rounded-tl-xl">
                              Interface / Screen
                            </th>
                            <th className="py-2.5 px-3 text-center w-20">
                              Read
                            </th>
                            <th className="py-2.5 px-3 text-center w-20">
                              Create
                            </th>
                            <th className="py-2.5 px-3 text-center w-20">
                              Update
                            </th>
                            <th className="py-2.5 px-4 text-center w-20 rounded-tr-xl">
                              Delete
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f4f1] text-xs bg-white">
                          {editInterfacePermissions.map((row) => (
                            <tr
                              key={row.id}
                              className="hover:bg-[#fafcfa] transition-colors"
                            >
                              <td className="py-3 px-4">
                                <span className="font-semibold text-[#10281d] block text-xs sm:text-sm">
                                  {row.name}
                                </span>
                                <span className="text-[#6b7c72] text-[11px] block mt-0.5">
                                  {row.description}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={row.read}
                                    onChange={(e) =>
                                      handleToggleEditPermission(
                                        row.id,
                                        "read",
                                        e.target.checked,
                                      )
                                    }
                                    className="w-4 h-4 rounded border-[#d1ded6] text-[#225740] focus:ring-[#225740] accent-[#225740] cursor-pointer"
                                    aria-label={`Read permission for ${row.name}`}
                                  />
                                </label>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={row.create}
                                    onChange={(e) =>
                                      handleToggleEditPermission(
                                        row.id,
                                        "create",
                                        e.target.checked,
                                      )
                                    }
                                    className="w-4 h-4 rounded border-[#d1ded6] text-[#225740] focus:ring-[#225740] accent-[#225740] cursor-pointer"
                                    aria-label={`Create permission for ${row.name}`}
                                  />
                                </label>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={row.update}
                                    onChange={(e) =>
                                      handleToggleEditPermission(
                                        row.id,
                                        "update",
                                        e.target.checked,
                                      )
                                    }
                                    className="w-4 h-4 rounded border-[#d1ded6] text-[#225740] focus:ring-[#225740] accent-[#225740] cursor-pointer"
                                    aria-label={`Update permission for ${row.name}`}
                                  />
                                </label>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={row.delete}
                                    onChange={(e) =>
                                      handleToggleEditPermission(
                                        row.id,
                                        "delete",
                                        e.target.checked,
                                      )
                                    }
                                    className="w-4 h-4 rounded border-[#d1ded6] text-[#225740] focus:ring-[#225740] accent-[#225740] cursor-pointer"
                                    aria-label={`Delete permission for ${row.name}`}
                                  />
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            {roles.length > 0 && (
              <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-[#f0f4f1]">
                <div>
                  {canDeleteRole && defaultEditRole && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteRoleId(editRoleId);
                        setShowConfirmModal(true);
                      }}
                      disabled={defaultEditRole.is_default || defaultEditRole.name.toLowerCase().includes("super admin")}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                      title={defaultEditRole.is_default ? "Default system roles cannot be deleted" : "Delete this role"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Role</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/roles")}
                    className="px-5 py-2 text-xs sm:text-sm font-semibold text-[#10281d] bg-white border border-[#d1ded6] hover:bg-[#f4f7f4] rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitEditRole}
                    disabled={isUpdating}
                    className="inline-flex items-center justify-center px-6 py-2 bg-[#10281d] hover:bg-[#16382b] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* CARD 3: DELETE ROLE */}
        {/* ======================================================== */}
        {canDeleteRole && activeTab === "delete" && (
          <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs flex flex-col justify-between max-w-2xl mx-auto w-full">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f0f4f1]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/roles")}
                    aria-label="Back to Roles"
                    className="w-9 h-9 rounded-full bg-[#eaf1ec] hover:bg-[#dbe7de] text-[#10281d] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-red-600 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Role</span>
                    </h2>
                    <p className="text-xs text-[#6b7c72] mt-0.5">
                      Permanently remove a role and inspect user assignments.
                    </p>
                  </div>
                </div>

                {/* Role Switcher */}
                <div>
                  {roles.length > 0 ? (
                    <select
                      value={String(deleteRoleId)}
                      onChange={(e) => handleSelectRoleToDelete(e.target.value)}
                      className="h-8 px-2.5 bg-[#f4f7f4] border border-[#d1ded6] rounded-lg text-xs font-medium text-[#10281d] focus:outline-none focus:border-[#225740] cursor-pointer"
                    >
                      {roles.map((r) => (
                        <option key={String(r.id)} value={String(r.id)}>
                          {r.name} {r.is_default ? "(System)" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-[#6b7c72]">No roles in DB</span>
                  )}
                </div>
              </div>

              {roles.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6b7c72]">
                  {isLoadingRoles ? "Loading roles..." : "No existing roles found in backend database to delete."}
                </div>
              ) : selectedDeleteRole ? (
                <div className="mt-5 space-y-4">
                  {/* Role Info Box */}
                  <div className="p-4 bg-[#f8faf8] border border-[#e5ebe7] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#10281d]">
                        {selectedDeleteRole.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {selectedDeleteRole.is_default ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1b4332] bg-[#d2e8dc] px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3" />
                            <span>System Default</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-semibold text-[#225740] bg-[#eef5f0] px-2 py-0.5 rounded-full">
                            Custom Role
                          </span>
                        )}
                        <span className="text-[11px] text-[#6b7c72] bg-white px-2 py-0.5 rounded-full border border-[#e0e8e2]">
                          {selectedDeleteRole.user_count || 0} user(s) assigned
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#6b7c72]">
                      {selectedDeleteRole.description || "Workspace role definition"}
                    </p>
                  </div>

                  {/* Warning Box */}
                  {selectedDeleteRole.is_default || selectedDeleteRole.name.toLowerCase().includes("super admin") ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs">
                      <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold mb-0.5">Protected System Role</strong>
                        Default system roles cannot be deleted. They are required to safeguard system administration and access control.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold mb-0.5">Destructive Action Warning</strong>
                        Deleting this role will permanently revoke it from the backend database. Any users currently assigned to this role will lose their granted access rights.
                      </div>
                    </div>
                  )}

                  {/* Permissions Summary */}
                  {selectedDeleteRole.permissions && selectedDeleteRole.permissions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-[#10281d] mb-2">
                        Granted Permissions ({selectedDeleteRole.permissions.length}):
                      </h4>
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                        {selectedDeleteRole.permissions.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[11px] font-mono text-[#10281d] bg-[#ebf1ed] px-2 py-0.5 rounded-md"
                          >
                            {p.name} ({p.type})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Bottom Actions */}
            {roles.length > 0 && selectedDeleteRole && (
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[#f0f4f1]">
                <button
                  type="button"
                  onClick={() => router.push("/roles")}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-[#10281d] bg-white border border-[#d1ded6] hover:bg-[#f4f7f4] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={
                    isDeleting ||
                    Boolean(selectedDeleteRole.is_default || selectedDeleteRole.name.toLowerCase().includes("super admin"))
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Role</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
