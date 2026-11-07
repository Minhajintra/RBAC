"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Alert } from "@/components/ui";
import PageHeader from "./PageHeader";
import UserStatsCards from "./UserStatsCards";
import UserFilters from "./UserFilters";
import UserTable from "./UserTable";
import UserPagination from "./UserPagination";
import UserCategoriesFooter from "./UserCategoriesFooter";
import UserFormModal from "./UserFormModal";
import ViewUserModal from "./ViewUserModal";
import DeleteUserDialog from "./DeleteUserDialog";
import UserScopeModal from "./UserScopeModal";
import { User, UserStats, UsersListResponse } from "../types/user.types";
import { getUsers } from "../actions/getUsers";
import { getRolesAction } from "@/app/(dashboard)/roles/actions/roles";

const DEFAULT_STATS: UserStats = {
  totalUsers: 0,
  activeUsers: 0,
  pendingInvitations: 0,
  inactiveUsers: 0,
  totalGrowth: "0%",
  activePercent: "0.0%",
  roleCounts: {
    teachers: 0,
    administrators: 0,
    supportStaff: 0,
    other: 0,
  },
};

interface UsersModuleProps {
  initialData?: UsersListResponse | null;
  initialStats?: UserStats | null;
}

export function UsersModule({ initialData, initialStats }: UsersModuleProps) {
  // Filter & Pagination States
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All roles");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(initialData?.page || 1);
  const pageSize = initialData?.pageSize || 6;

  // Data States
  const [users, setUsers] = useState<User[]>(initialData?.users || []);
  const [total, setTotal] = useState(initialData?.total || 0);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);
  const [stats, setStats] = useState<UserStats>(
    initialStats || initialData?.stats || DEFAULT_STATS,
  );
  const [isLoading, setIsLoading] = useState(!initialData);

  // Available roles for filter dropdown (loaded dynamically from backend API)
  const [allKnownRoles, setAllKnownRoles] = useState<string[]>(["All roles"]);

  useEffect(() => {
    getRolesAction()
      .then((roles) => {
        if (roles && roles.length > 0) {
          const names = roles.map((r) => r.name).filter(Boolean);
          setAllKnownRoles((prev) => Array.from(new Set([...prev, ...names])));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      setAllKnownRoles((prev) => {
        const nextSet = new Set(prev);
        users.forEach((u) => {
          if (u.role && u.role.trim()) nextSet.add(u.role.trim());
        });
        return Array.from(nextSet);
      });
    }
  }, [users]);

  // Modals States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [scopeUser, setScopeUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Success Toast notification
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUsers({
        search,
        role: role === "All roles" ? undefined : role,
        status: status === "All statuses" ? undefined : status,
        page,
        pageSize,
      });

      setUsers(response.users || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, role, status, page, pageSize]);

  useEffect(() => {
    // If initialData is available and no filters are active, skip initial fetch
    if (initialData && !search && role === "All roles" && status === "All statuses" && page === 1) {
      setUsers(initialData.users || []);
      setTotal(initialData.total || 0);
      setTotalPages(initialData.totalPages || 1);
      if (initialData.stats) setStats(initialData.stats);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    const timer = setTimeout(() => {
      getUsers({
        search,
        role: role === "All roles" ? undefined : role,
        status: status === "All statuses" ? undefined : status,
        page,
        pageSize,
      })
        .then((response) => {
          if (!isMounted) return;
          setUsers(response.users || []);
          setTotal(response.total || 0);
          setTotalPages(response.totalPages || 1);
          if (response.stats) {
            setStats(response.stats);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Failed to fetch users:", err);
          setIsLoading(false);
        });
    }, search ? 200 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, role, status, page, pageSize, initialData]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleRoleChange = (val: string) => {
    setRole(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  const handleExportUsers = () => {
    if (users.length === 0) {
      alert("No users available to export.");
      return;
    }

    const headers = ["ID", "Name", "Email", "Role", "Status", "Last Active"];
    const rows = users.map((u) => [
      `"${u.id}"`,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.lastActive}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `intraship_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("User directory exported to CSV successfully.");
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <Alert
          variant="success"
          message={toastMessage}
          onClose={() => setToastMessage("")}
          className="shadow-sm animate-fade-in"
        />
      )}

      {/* Top Title & Add User Action */}
      <PageHeader
        onAssignScope={() => {
          setScopeUser(null);
          setIsScopeOpen(true);
        }}
        onAddUser={() => {
          setEditingUser(null);
          setIsFormOpen(true);
        }}
      />

      {/* 4 Metric / KPI Cards */}
      <section aria-label="Users Statistics">
        <UserStatsCards stats={stats} />
      </section>

      {/* Main User Directory Card */}
      <section aria-label="User Management Table">
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e5ece7] shadow-sm">
          <UserFilters
            search={search}
            onSearchChange={handleSearchChange}
            role={role}
            onRoleChange={handleRoleChange}
            status={status}
            onStatusChange={handleStatusChange}
            onExport={handleExportUsers}
            roleOptions={allKnownRoles}
          />

          <UserTable
            users={users}
            isLoading={isLoading}
            onView={(user) => setViewingUser(user)}
            onEdit={(user) => {
              setEditingUser(user);
              setIsFormOpen(true);
            }}
            onDelete={(user) => setDeletingUser(user)}
          />

          <UserPagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </section>

      {/* Bottom Summary Bar */}
      <section aria-label="User Categories Summary">
        <UserCategoriesFooter stats={stats} />
      </section>

      {/* Add / Edit User Form Modal */}
      <UserFormModal
        isOpen={isFormOpen}
        initialUser={editingUser}
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          fetchUsers();
          showToast(
            editingUser
              ? `User "${editingUser.name}" updated successfully.`
              : "New user account created successfully.",
          );
        }}
      />

      {/* View User Modal */}
      <ViewUserModal
        isOpen={Boolean(viewingUser)}
        user={viewingUser}
        onClose={() => setViewingUser(null)}
        onEdit={(user) => {
          setViewingUser(null);
          setEditingUser(user);
          setIsFormOpen(true);
        }}
      />

      {/* Delete User Confirmation Dialog */}
      <DeleteUserDialog
        isOpen={Boolean(deletingUser)}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onSuccess={() => {
          fetchUsers();
          showToast("User was successfully deleted.");
        }}
      />

      {/* User Scope Assignment Modal */}
      <UserScopeModal
        isOpen={isScopeOpen}
        users={users}
        selectedUser={scopeUser}
        onClose={() => {
          setIsScopeOpen(false);
          setScopeUser(null);
        }}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
}

export default UsersModule;
