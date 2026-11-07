"use client";

import React, { useState } from "react";
import { MoreHorizontal, Eye, Edit2, Trash2, Shield } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Checkbox,
  EmptyState,
} from "@/components/ui";
import { usePermissions } from "@/context/permission-context";
import { User } from "../types/user.types";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserTable({
  users,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: UserTableProps) {
  const { can } = usePermissions();
  const canReadUser = can("users", "read");
  const canUpdateUser = can("users", "update");
  const canDeleteUser = can("users", "delete");
  const hasAnyRowAction = canReadUser || canUpdateUser || canDeleteUser;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-[#e5ece7]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#edf2ee] text-[10.5px] uppercase font-bold text-[#6b7c72] tracking-wider">
              <th className="p-3 w-10"></th>
              <th className="p-3">User</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Active</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef3ef] bg-white">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="p-3">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200"></div>
                    <div className="space-y-1.5">
                      <div className="w-24 h-3.5 bg-gray-200 rounded"></div>
                      <div className="w-32 h-2.5 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </td>
                <td className="p-3">
                  <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
                </td>
                <td className="p-3">
                  <div className="w-20 h-3 bg-gray-100 rounded"></div>
                </td>
                <td className="p-3">
                  <div className="w-6 h-6 bg-gray-100 rounded"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="We couldn't find any users matching your search filters. Try adjusting your query or resetting filters."
        icon={<Shield className="w-6 h-6 text-[#225740]" />}
        className="rounded-2xl border border-dashed border-[#dbe5dd] bg-[#f8faf8] my-4"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5ece7]">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="bg-[#edf2ee] text-[10.5px] uppercase font-bold text-[#6b7c72] tracking-wider">
            <TableHead className="p-3 w-10">
              <Checkbox
                checked={
                  selectedIds.length > 0 && selectedIds.length === users.length
                }
                onChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="p-3">User</TableHead>
            <TableHead className="p-3">Role</TableHead>
            <TableHead className="p-3">Status</TableHead>
            <TableHead className="p-3">Last Active</TableHead>
            <TableHead className="p-3 text-right pr-4 w-14"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[#eef3ef] bg-white text-xs text-[#16382b]">
          {users.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            const isMenuOpen = activeMenuId === user.id;

            return (
              <TableRow
                key={user.id}
                className={`hover:bg-[#f9fbf9] transition-colors ${
                  isSelected ? "bg-[#f4f8f5]" : ""
                }`}
              >
                {/* Checkbox */}
                <TableCell className="p-3">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelectRow(user.id)}
                  />
                </TableCell>

                {/* User Info (Avatar + Name + Email) */}
                <TableCell className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#e6efe8] text-[#16382b] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#c7ded0]">
                      {user.initials}
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-[#11261c] leading-snug">
                        {user.name}
                      </span>
                      <span className="block text-[11px] text-[#6b7c72] leading-tight">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell className="p-3 font-medium text-[#16382b]">
                  {user.role}
                </TableCell>

                {/* Status Badge */}
                <TableCell className="p-3">
                  <Badge
                    variant={
                      user.status === "Active"
                        ? "success"
                        : user.status === "Pending"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>

                {/* Last Active */}
                <TableCell className="p-3 text-[#6b7c72] font-medium text-[11.5px]">
                  {user.lastActive}
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="p-3 text-right pr-4 relative">
                  {hasAnyRowAction ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : user.id);
                        }}
                        aria-label="Actions"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#11261c] hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-3 top-10 z-30 w-36 bg-white rounded-xl shadow-lg border border-[#e5ece7] py-1 text-left animate-fade-in">
                            {canReadUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onView(user);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-[#16382b] hover:bg-[#f4f7f4] flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-400" />
                                <span>View details</span>
                              </button>
                            )}

                            {canUpdateUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEdit(user);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-[#16382b] hover:bg-[#f4f7f4] flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                                <span>Edit user</span>
                              </button>
                            )}

                            {canDeleteUser && (canReadUser || canUpdateUser) && (
                              <div className="border-t border-[#eef3ef] my-1" />
                            )}

                            {canDeleteUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDelete(user);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                <span>Delete user</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
