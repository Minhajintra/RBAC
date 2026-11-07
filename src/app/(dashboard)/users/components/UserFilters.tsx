"use client";

import React from "react";
import { Search, Download } from "lucide-react";
import { Button, Input, Select, PermissionGuard } from "@/components/ui";

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  onExport: () => void;
  roleOptions?: string[];
}

export default function UserFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  onExport,
  roleOptions,
}: UserFiltersProps) {
  return (
    <div className="space-y-3.5 mb-4">
      {/* Container header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#11261c] tracking-tight">
            All users
          </h2>
          <p className="text-xs text-[#6b7c72]">
            Account directory and access status
          </p>
        </div>

        <PermissionGuard module="users" action="read">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExport}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export users
          </Button>
        </PermissionGuard>
      </div>

      {/* Filter controls row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search input */}
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or email..."
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>

        {/* Roles Dropdown */}
        <div className="min-w-[140px]">
          <Select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            options={
              roleOptions && roleOptions.length > 0
                ? roleOptions
                : [
                    "All roles",
                    "Super Admin",
                    "Programme Admin",
                    "Editor",
                    "Viewer",
                    "SENIOR_ANALYST",
                  ]
            }
          />
        </div>

        {/* Statuses Dropdown */}
        <div className="min-w-[140px]">
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            options={["All statuses", "Active", "Pending", "Inactive"]}
          />
        </div>
      </div>
    </div>
  );
}
