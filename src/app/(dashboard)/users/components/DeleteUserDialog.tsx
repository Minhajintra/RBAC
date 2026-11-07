"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Alert } from "@/components/ui";
import { User } from "../types/user.types";
import { deleteUserAction } from "../actions/users";

interface DeleteUserDialogProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteUserDialog({
  isOpen,
  user,
  onClose,
  onSuccess,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !user) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await deleteUserAction(user.id);
      if (!response.success) {
        setErrorMessage(response.message || "Failed to delete user.");
        setIsDeleting(false);
        return;
      }

      setIsDeleting(false);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete user.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-[#e5ece7] rounded-3xl shadow-2xl overflow-hidden p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#fde4e4] text-[#b42318] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[#11261c] mb-1">
          Delete User Account
        </h3>

        <p className="text-xs sm:text-sm text-[#6b7c72] leading-relaxed mb-4">
          Are you sure you want to delete{" "}
          <span className="font-bold text-[#11261c]">{user.name}</span> (
          {user.email})? This action will revoke all permissions and remove the
          user from the workspace directory.
        </p>

        {errorMessage && (
          <Alert
            variant="error"
            message={errorMessage}
            className="mb-4 text-left"
          />
        )}

        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
          >
            Delete User
          </Button>
        </div>
      </div>
    </div>
  );
}
