"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus } from "lucide-react";
import { Button, Alert } from "@/components/ui";
import { userFormSchema, UserFormData } from "../schema/userSchema";
import { User, CreateUserInput, UpdateUserInput } from "../types/user.types";
import { createUserAction, updateUserAction } from "../actions/users";
import { getRolesAction } from "@/app/(dashboard)/roles/actions/roles";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialUser?: User | null;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialUser,
}: UserFormModalProps) {
  const isEditMode = Boolean(initialUser);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Roles fetched directly from backend API
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState("");
  const [showAddRoleInput, setShowAddRoleInput] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      status: "Active",
      role: "",
      notificationAlerts: false,
      emailMfa: false,
      smsMfa: false,
      deviceBinding: false,
      deviceId: "",
      accessEnvironment: "Production",
      assignedRoles: [],
    },
  });

  const assignedRoles = useWatch({ control, name: "assignedRoles" }) || [];

  // Fetch available roles from backend API
  useEffect(() => {
    let isMounted = true;
    async function fetchRoles() {
      setIsLoadingRoles(true);
      try {
        const roles = await getRolesAction();
        if (isMounted && Array.isArray(roles) && roles.length > 0) {
          const names = roles.map((r) => r.name).filter(Boolean);
          setAvailableRoles(Array.from(new Set(names)));
        }
      } catch (err) {
        console.warn("[UserFormModal] Failed to fetch roles:", err);
        try {
          const res = await fetch("/api/v1/roles/all");
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
          if (isMounted && list.length > 0) {
            const names = list.map((r: { name?: string; role_name?: string }) => r.name || r.role_name).filter(Boolean);
            setAvailableRoles(Array.from(new Set(names)));
          }
        } catch {
          // ignore
        }
      } finally {
        if (isMounted) setIsLoadingRoles(false);
      }
    }

    if (isOpen) {
      fetchRoles();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Dynamic User Type dropdown options (includes currently assigned user role if editing)
  const roleDropdownOptions = useMemo(() => {
    const set = new Set<string>();
    if (initialUser?.role && initialUser.role.trim()) {
      set.add(initialUser.role.trim());
    }
    availableRoles.forEach((r) => set.add(r));
    return Array.from(set);
  }, [availableRoles, initialUser]);

  // Unassigned roles for "+ Add Role" dropdown (prevents duplicates)
  const unassignedRoles = useMemo(() => {
    return availableRoles.filter((r) => !assignedRoles.includes(r));
  }, [availableRoles, assignedRoles]);

  useEffect(() => {
    if (showAddRoleInput) {
      setSelectedRoleToAdd(unassignedRoles[0] || "");
    }
  }, [showAddRoleInput, unassignedRoles]);

  // Reset or prepopulate on user change or modal open
  useEffect(() => {
    if (isOpen) {
      setServerError("");
      setShowAddRoleInput(false);
      setSelectedRoleToAdd("");

      if (initialUser) {
        reset({
          name: initialUser.name,
          email: initialUser.email,
          status: initialUser.status,
          role: initialUser.role,
          notificationAlerts: false,
          emailMfa: false,
          smsMfa: false,
          deviceBinding: false,
          deviceId: "",
          accessEnvironment: "Production",
          assignedRoles:
            initialUser.roles && initialUser.roles.length > 0
              ? initialUser.roles
              : [initialUser.role],
        });
      } else {
        const defaultRole = availableRoles[0] || "";
        reset({
          name: "",
          email: "",
          status: "Active",
          role: defaultRole,
          notificationAlerts: false,
          emailMfa: false,
          smsMfa: false,
          deviceBinding: false,
          deviceId: "",
          accessEnvironment: "Production",
          assignedRoles: defaultRole ? [defaultRole] : [],
        });
      }
    }
  }, [isOpen, initialUser, reset, availableRoles]);

  if (!isOpen) return null;

  const onAddRoleTag = () => {
    if (!selectedRoleToAdd.trim()) return;
    const roleToAdd = selectedRoleToAdd.trim();
    if (!assignedRoles.includes(roleToAdd)) {
      setValue("assignedRoles", [...assignedRoles, roleToAdd]);
    }
    setSelectedRoleToAdd("");
    setShowAddRoleInput(false);
  };

  const onRemoveRoleTag = (roleToRemove: string) => {
    setValue(
      "assignedRoles",
      assignedRoles.filter((r) => r !== roleToRemove),
    );
  };

  const onSubmitForm = async (data: UserFormData) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      if (isEditMode && initialUser) {
        const payload: UpdateUserInput = {
          id: initialUser.id,
          ...data,
        };
        const response = await updateUserAction(payload);
        if (!response.success) {
          setServerError(response.message || "Failed to update user.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const payload: CreateUserInput = {
          ...data,
        };
        const response = await createUserAction(payload);
        if (!response.success) {
          setServerError(response.message || "Failed to create user.");
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#f8faf8] border border-[#e5ece7] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e5ece7]">
          <div>
            <h2 className="text-xl font-extrabold text-[#11261c] tracking-tight">
              {isEditMode ? "Edit User" : "Add / Edit User"}
            </h2>
            <p className="text-xs text-[#6b7c72] mt-0.5">
              Personal information, account security and role assignment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit(onSubmitForm)}
          noValidate
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
        >
          {serverError && (
            <Alert variant="error" message={serverError} className="mb-2" />
          )}

          {/* 1. Personal Information Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#e5ece7] shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#11261c]">
                Personal information
              </h3>
              <p className="text-xs text-[#6b7c72]">
                {isEditMode
                  ? "Update user account credentials"
                  : "Create New User"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full name */}
              <div>
                <label className="block text-xs font-bold text-[#16382b] mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="Enter full name"
                  className={`w-full h-10 px-3.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.name
                      ? "border-[#d92d20] focus:ring-1 focus:ring-[#d92d20]"
                      : "border-[#dbe5dd] focus:border-[#225740] focus:ring-1 focus:ring-[#225740]"
                  } text-[#16382b] placeholder:text-gray-400`}
                />
                {errors.name && (
                  <p className="mt-1 text-[11px] text-[#d92d20] font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#16382b] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="Enter email address"
                  className={`w-full h-10 px-3.5 text-xs sm:text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                    errors.email
                      ? "border-[#d92d20] focus:ring-1 focus:ring-[#d92d20]"
                      : "border-[#dbe5dd] focus:border-[#225740] focus:ring-1 focus:ring-[#225740]"
                  } text-[#16382b] placeholder:text-gray-400`}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-[#d92d20] font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-[#16382b] mb-1">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white border border-[#dbe5dd] rounded-xl text-[#16382b] focus:outline-none focus:border-[#225740] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-[11px] text-[#d92d20] font-medium">
                    {errors.status.message}
                  </p>
                )}
              </div>

              {/* User type / Primary Role - Dynamic from Backend API */}
              <div>
                <label className="block text-xs font-bold text-[#16382b] mb-1">
                  User type
                </label>
                <select
                  {...register("role", {
                    onChange: (e) => {
                      const newRole = e.target.value;
                      if (newRole && !assignedRoles.includes(newRole)) {
                        setValue("assignedRoles", [...assignedRoles, newRole]);
                      }
                    },
                  })}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white border border-[#dbe5dd] rounded-xl text-[#16382b] focus:outline-none focus:border-[#225740] cursor-pointer"
                >
                  {isLoadingRoles && roleDropdownOptions.length === 0 ? (
                    <option value="">Loading roles...</option>
                  ) : (
                    roleDropdownOptions.map((roleName) => (
                      <option key={roleName} value={roleName}>
                        {roleName}
                      </option>
                    ))
                  )}
                </select>
                {errors.role && (
                  <p className="mt-1 text-[11px] text-[#d92d20] font-medium">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. User Roles Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#e5ece7] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#11261c]">User roles</h3>
              <button
                type="button"
                onClick={() => setShowAddRoleInput(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#f4f7f4] hover:bg-[#e6efe8] text-xs font-bold text-[#225740] transition-colors cursor-pointer border border-[#dbe5dd]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            {/* Role Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 min-h-[36px]">
              {assignedRoles.length === 0 ? (
                <span className="text-xs text-[#6b7c72] italic">
                  No roles assigned in this draft.
                </span>
              ) : (
                assignedRoles.map((roleTag) => (
                  <span
                    key={roleTag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e6efe8] text-[#225740] border border-[#c7ded0]"
                  >
                    <span>{roleTag}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveRoleTag(roleTag)}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Role dropdown popover/inline - populated from Backend API */}
            {showAddRoleInput && (
              <div className="flex items-center gap-2 pt-2 animate-fade-in">
                <select
                  value={selectedRoleToAdd}
                  onChange={(e) => setSelectedRoleToAdd(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs bg-white border border-[#225740] rounded-xl focus:outline-none text-[#16382b] cursor-pointer"
                >
                  {unassignedRoles.length === 0 ? (
                    <option value="">All available roles assigned</option>
                  ) : (
                    unassignedRoles.map((roleName) => (
                      <option key={roleName} value={roleName}>
                        {roleName}
                      </option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={onAddRoleTag}
                  disabled={!selectedRoleToAdd || unassignedRoles.length === 0}
                  className="px-3.5 py-1.5 bg-[#225740] text-white text-xs font-bold rounded-xl hover:bg-[#183f2e] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoleInput(false);
                    setSelectedRoleToAdd("");
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <p className="text-[11px] text-[#6b7c72] pt-1">
              Assign one or more roles. Effective access is the union of
              assigned roles.
            </p>
          </div>

          {/* Form Actions footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5ece7]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              loadingText="Saving User..."
            >
              Save User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
