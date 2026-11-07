"use client";

import React from "react";
import { Plus, MapPin } from "lucide-react";
import { Button, PermissionGuard } from "@/components/ui";

interface PageHeaderProps {
  onAssignScope?: () => void;
  onAddUser?: () => void;
}

/**
 * Users Page Header Component
 * Displays the page title, description, and primary action buttons
 */
export function PageHeader({ onAssignScope, onAddUser }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11261c] tracking-tight">
          Users
        </h1>
        <p className="text-xs sm:text-sm text-[#6b7c72] mt-0.5">
          Manage the people, roles and account access in your workspace.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {onAssignScope && (
          <PermissionGuard module="users" action="update">
            <Button
              variant="secondary"
              onClick={onAssignScope}
              icon={<MapPin className="w-4 h-4" />}
            >
              Assign scope
            </Button>
          </PermissionGuard>
        )}

        {onAddUser && (
          <PermissionGuard module="users" action="create">
            <Button
              variant="primary"
              onClick={onAddUser}
              icon={<Plus className="w-4 h-4" />}
            >
              Add user
            </Button>
          </PermissionGuard>
        )}
      </div>
    </div>
  );
}

export default PageHeader;

