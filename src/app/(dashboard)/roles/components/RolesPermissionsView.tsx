"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ChevronRight,
  LayoutGrid,
  Layers,
  User,
  Check,
  ShieldAlert,
  Trash2,
  Edit,
} from "lucide-react";
import { usePermissions } from "@/context/permission-context";
import { RoleItem, RolesPageStats } from "../types/role.types";
import { getRolePermissionsAction, getRolesAction } from "../actions/roles";
import { buildMatrixFromBackendPermissions } from "../utils/roleMatrix.utils";

interface RolesPermissionsViewProps {
  initialRoles?: RoleItem[];
  stats?: RolesPageStats;
}

export default function RolesPermissionsView({
  initialRoles = [],
  stats,
}: RolesPermissionsViewProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string | number>(
    roles[0]?.id ?? "",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Backend RBAC permissions for current user on Roles module
  const canCreateRole = can("roles", "create");
  const canUpdateRole = can("roles", "update");
  const canDeleteRole = can("roles", "delete");

  // Dynamically resolve permissions if selectedRole matrix is completely unallowed (all dashes)
  useEffect(() => {
    if (roles.length === 0) {
      getRolesAction().then((fetched) => {
        if (fetched && fetched.length > 0) {
          setRoles(fetched);
          if (!selectedRoleId) {
            setSelectedRoleId(fetched[0].id);
          }
        }
      });
    }
  }, [roles.length, selectedRoleId]);

  // Filtered roles for directory
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [roles, searchQuery]);

  // Selected role object
  const selectedRole = useMemo(() => {
    if (roles.length === 0) return null;
    return (
      roles.find(
        (r) =>
          String(r.id) === String(selectedRoleId) ||
          r.name.toLowerCase() === String(selectedRoleId).toLowerCase(),
      ) || roles[0]
    );
  }, [roles, selectedRoleId]);

  // Dynamically resolve permissions if selectedRole matrix is completely unallowed (all dashes)
  useEffect(() => {
    if (!selectedRole) return;
    const hasAnyAllowed = selectedRole.matrix.some((r) => r.view || r.edit || r.update || r.delete);
    if (!hasAnyAllowed && selectedRole.id) {
      getRolePermissionsAction(selectedRole.id).then((perms) => {
        if (perms && perms.length > 0) {
          const rawBackendItems = perms.map((p) => ({
            permission_name: p.name,
            permission_type: p.type,
            description: p.description,
            read: p.type === "View",
            create: p.type === "Create",
            update: p.type === "Update" || p.type === "Edit",
            delete: p.type === "Delete",
          }));
          const newMatrix = buildMatrixFromBackendPermissions(
            rawBackendItems,
            selectedRole.name,
            selectedRole.is_default,
          );
          setRoles((prev) =>
            prev.map((r) =>
              String(r.id) === String(selectedRole.id)
                ? { ...r, permissions: perms, matrix: newMatrix }
                : r,
            ),
          );
        }
      });
    }
  }, [selectedRole]);

  // Dynamic statistics calculated directly from backend data
  const totalRoles = stats?.totalRoles ?? roles.length;
  const activeRolesCount =
    stats?.activeRolesCount ??
    roles.filter((r) => r.is_active !== false).length;
  const defaultRolesCount =
    stats?.defaultRolesCount ?? roles.filter((r) => r.is_default).length;
  const customRolesCount =
    stats?.customRolesCount ?? Math.max(0, totalRoles - defaultRolesCount);
  const totalUsers =
    stats?.totalUsers ??
    roles.reduce((acc, r) => acc + (r.user_count || 0), 0);

  const defaultRoleNames = useMemo(() => {
    const names = roles.filter((r) => r.is_default).map((r) => r.name);
    return names.length > 0 ? names.join(", ") : "System roles";
  }, [roles]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#10281d] tracking-tight leading-tight">
            Roles & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7c72] mt-1">
            Define who can do what, with clear and consistent access policies.
          </p>
        </div>

        <div>
          {canCreateRole ? (
            <button
              type="button"
              onClick={() => router.push("/roles/create?mode=create")}
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#10281d] hover:bg-[#16382b] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create role</span>
            </button>
          ) : canUpdateRole ? (
            <button
              type="button"
              onClick={() =>
                router.push(
                  selectedRole
                    ? `/roles/create?id=${selectedRole.id}&mode=edit`
                    : `/roles/create?mode=edit`,
                )
              }
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#10281d] hover:bg-[#16382b] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Edit className="w-4 h-4" />
              <span>Edit role</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 4 Stats Cards - Computed directly from Backend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Active Roles */}
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs transition-all hover:border-[#ccdcd1]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#eef5f0] flex items-center justify-center text-[#225740]">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 12l10 10 10-10L12 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-[#6b7c72] block">
              Active Roles
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#10281d]">
                {activeRolesCount}
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-[#225740] bg-[#eef5f0] px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-[#6b7c72] mt-1">
              {totalRoles} roles configured
            </p>
          </div>
        </div>

        {/* Card 2: Default roles */}
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs transition-all hover:border-[#ccdcd1]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#eef5f0] flex items-center justify-center text-[#225740]">
              <LayoutGrid className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-[#6b7c72] block">
              Default roles
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#10281d]">
                {defaultRolesCount}
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-[#225740] bg-[#eef5f0] px-2 py-0.5 rounded-full">
                Standard
              </span>
            </div>
            <p className="text-xs text-[#6b7c72] mt-1 truncate">
              {defaultRoleNames}
            </p>
          </div>
        </div>

        {/* Card 3: Custom roles */}
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs transition-all hover:border-[#ccdcd1]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#eef5f0] flex items-center justify-center text-[#225740]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-[#6b7c72] block">
              Custom roles
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#10281d]">
                {customRolesCount}
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-[#225740] bg-[#eef5f0] px-2 py-0.5 rounded-full">
                Custom
              </span>
            </div>
            <p className="text-xs text-[#6b7c72] mt-1">
              tailored to your workspace
            </p>
          </div>
        </div>

        {/* Card 4: Total Users */}
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs transition-all hover:border-[#ccdcd1]">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#eef5f0] flex items-center justify-center text-[#225740]">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-[#6b7c72] block">
              Total Users
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#10281d]">
                {totalUsers}
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-[#225740] bg-[#eef5f0] px-2 py-0.5 rounded-full">
                Database
              </span>
            </div>
            <p className="text-xs text-[#6b7c72] mt-1">
              across all user categories
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {roles.length === 0 ? (
        /* Empty State when no roles found in backend */
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#eef5f0] text-[#225740] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#10281d]">
            No roles configured in database
          </h2>
          <p className="text-xs sm:text-sm text-[#6b7c72] max-w-md mx-auto mt-1 mb-6">
            There are currently no roles stored in the backend database. You can define your first role and configure its access policies.
          </p>
          {canCreateRole && (
            <button
              type="button"
              onClick={() => router.push("/roles/create?mode=create")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10281d] hover:bg-[#16382b] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Role</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Role Directory */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs flex flex-col">
            <div>
              <h2 className="text-base font-bold text-[#10281d]">
                Role directory
              </h2>
              <p className="text-xs text-[#6b7c72] mt-0.5">
                {roles.length} configured role{roles.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative mt-3.5 mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a role..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-[#d1ded6] rounded-xl text-[#10281d] placeholder:text-gray-400 focus:outline-none focus:border-[#225740] focus:ring-1 focus:ring-[#225740] transition-colors"
              />
            </div>

            {/* Roles Directory List */}
            <div className="space-y-1 overflow-y-auto max-h-[620px] pr-1">
              {filteredRoles.map((role) => {
                const isSelected =
                  selectedRole &&
                  String(role.id) === String(selectedRole.id);

                return (
                  <button
                    key={String(role.id)}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#eaf1ec] border border-[#d6e5db] shadow-2xs"
                        : "hover:bg-[#f4f7f4] border border-transparent"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isSelected ? "text-[#10281d]" : "text-[#16382b]"
                          }`}
                        >
                          {role.name}
                        </p>
                        {role.user_count !== undefined && role.user_count > 0 && (
                          <span className="text-[10px] text-[#6b7c72] bg-white/70 px-1.5 py-0.2 rounded-full border border-[#e0e8e2]">
                            {role.user_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6b7c72] mt-0.5 truncate">
                        {role.description || "Workspace role"}
                      </p>
                    </div>
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-[#10281d] flex-shrink-0" />
                    )}
                  </button>
                );
              })}

              {filteredRoles.length === 0 && (
                <div className="py-8 text-center text-xs text-[#6b7c72]">
                  No roles match &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Role Details & Matrix */}
          {selectedRole && (
            <div className="lg:col-span-8 bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs">
              {/* Header of selected role */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f0f4f1]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#10281d]">
                    {selectedRole.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6b7c72] mt-0.5">
                    {selectedRole.description || "Workspace role access"}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="inline-flex items-center text-xs font-semibold text-[#1b4332] bg-[#d2e8dc] px-2.5 py-0.5 rounded-full">
                      {selectedRole.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-[#6b7c72]">
                      {selectedRole.is_default ? "Default role" : "Custom role"}{" "}
                      • Workspace-wide
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canUpdateRole && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/roles/create?id=${selectedRole.id}&mode=edit`,
                        )
                      }
                      className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-[#10281d] bg-white border border-[#d1ded6] hover:bg-[#f4f7f4] rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Edit role
                    </button>
                  )}
                  {canDeleteRole && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/roles/create?id=${selectedRole.id}&mode=delete`,
                        )
                      }
                      disabled={selectedRole.is_default || selectedRole.name.toLowerCase().includes("super admin")}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                      title={selectedRole.is_default ? "Default system roles cannot be deleted" : "Delete this role"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Callout Banner */}
              <div className="bg-[#f4f7f4] border border-[#e5ebe7] rounded-xl p-4 my-5">
                <h3 className="text-xs sm:text-sm font-bold text-[#10281d]">
                  {selectedRole.callout_title || `Manage ${selectedRole.name} access`}
                </h3>
                <p className="text-xs text-[#6b7c72] mt-1 leading-relaxed">
                  {selectedRole.callout_desc ||
                    `Administrators can manage users, assign ${selectedRole.name} roles and configure system access.`}
                </p>
              </div>

              {/* Permission Matrix Section */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-[#10281d]">
                    Permission matrix
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-[#10281d] font-semibold">
                      <Check className="w-3.5 h-3.5 text-[#1b4332]" />
                      <span>Allowed</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#6b7c72] font-medium">
                      <span className="text-[#9dbba7] font-bold">—</span>
                      <span>Not allowed</span>
                    </span>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[540px]">
                    <thead>
                      <tr className="bg-[#ebf1ed] text-[#4a5e52] text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4 rounded-l-lg">RESOURCE</th>
                        <th className="py-2.5 px-3 text-center">VIEW</th>
                        <th className="py-2.5 px-3 text-center">CREATE</th>
                        <th className="py-2.5 px-3 text-center">UPDATE</th>
                        <th className="py-2.5 px-4 text-center rounded-r-lg">
                          DELETE
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f1] text-xs">
                      {selectedRole.matrix.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-[#fafcfa] transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#10281d] block">
                              {row.resource}
                            </span>
                            <span className="text-[#6b7c72] text-[11px] block mt-0.5">
                              {row.description}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {row.view ? (
                              <span className="text-[#1b4332] font-bold text-sm">
                                ✓
                              </span>
                            ) : (
                              <span className="text-[#9dbba7] font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {(row.create ?? row.edit) ? (
                              <span className="text-[#1b4332] font-bold text-sm">
                                ✓
                              </span>
                            ) : (
                              <span className="text-[#9dbba7] font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {row.update ? (
                              <span className="text-[#1b4332] font-bold text-sm">
                                ✓
                              </span>
                            ) : (
                              <span className="text-[#9dbba7] font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {row.delete ? (
                              <span className="text-[#1b4332] font-bold text-sm">
                                ✓
                              </span>
                            ) : (
                              <span className="text-[#9dbba7] font-semibold">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer of Card */}
              <div className="mt-6 pt-4 border-t border-[#f0f4f1] text-xs text-[#6b7c72]">
                Last updated: {selectedRole.last_updated || "Synchronized with Backend API"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Page Footer */}
      <div className="pt-2 text-xs text-[#9dbba7] flex items-center justify-between">
        <span>IntraShip UAM • Role-Based Access Control</span>
      </div>
    </div>
  );
}
