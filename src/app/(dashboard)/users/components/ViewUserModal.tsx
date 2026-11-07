"use client";

import React from "react";
import { X, Edit2, Clock, Laptop } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { usePermissions } from "@/context/permission-context";
import { User } from "../types/user.types";

interface ViewUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
}

export default function ViewUserModal({
  isOpen,
  user,
  onClose,
  onEdit,
}: ViewUserModalProps) {
  const { can } = usePermissions();
  const canUpdateUser = can("users", "update");

  if (!isOpen || !user) return null;

  const sec = user.securitySettings;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-[#e5ece7] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5ece7]">
          <h2 className="text-base sm:text-lg font-bold text-[#11261c]">
            User Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-[#16382b]">
          {/* Avatar and Basic info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8faf8] border border-[#eef3ef]">
            <div className="w-14 h-14 rounded-full bg-[#225740] text-white flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#11261c] truncate">
                  {user.name}
                </h3>
                <Badge
                  variant={
                    user.status === "Active"
                      ? "success"
                      : user.status === "Pending"
                        ? "warning"
                        : "neutral"
                  }
                  size="sm"
                >
                  {user.status}
                </Badge>
              </div>
              <p className="text-xs text-[#6b7c72] truncate">{user.email}</p>
              <p className="text-[11px] text-[#225740] font-semibold mt-1">
                Primary Role: {user.role}
              </p>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[#11261c] uppercase tracking-wider text-[10.5px]">
              Access & Activity
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#f4f7f4] border border-[#e5ece7]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6b7c72] mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#225740]" />
                  <span>Last Active</span>
                </div>
                <span className="font-bold text-[#11261c] text-xs">
                  {user.lastActive}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#f4f7f4] border border-[#e5ece7]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6b7c72] mb-1">
                  <Laptop className="w-3.5 h-3.5 text-[#225740]" />
                  <span>Environment</span>
                </div>
                <span className="font-bold text-[#11261c] text-xs">
                  {sec?.accessEnvironment || "Production"}
                </span>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#11261c] uppercase tracking-wider text-[10.5px]">
              Security Configuration
            </h4>
            <div className="p-3.5 rounded-xl border border-[#e5ece7] bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7c72]">Notification alerts</span>
                <span className="font-bold text-[#11261c]">
                  {sec?.notificationAlerts ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7c72]">Email MFA</span>
                <span className="font-bold text-[#11261c]">
                  {sec?.emailMfa ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7c72]">SMS MFA</span>
                <span className="font-bold text-[#11261c]">
                  {sec?.smsMfa ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7c72]">Device binding</span>
                <span className="font-bold text-[#11261c]">
                  {sec?.deviceBinding
                    ? `Bound (${sec.deviceId || "Registered"})`
                    : "Not bound"}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Roles */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#11261c] uppercase tracking-wider text-[10.5px]">
              Assigned Workspace Roles
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(user.roles && user.roles.length > 0
                ? user.roles
                : [user.role]
              ).map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e6efe8] text-[#225740] border border-[#c7ded0]"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-[#f8faf8] border-t border-[#e5ece7]">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          {canUpdateUser && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              icon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit User
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
