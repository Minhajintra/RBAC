import React from "react";
import { FolderSearch } from "lucide-react";
import Button from "./Button";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title = "No records found",
  description = "No items match your active filters or search criteria.",
  actionText,
  actionLabel,
  onAction,
  icon,
  className = "",
}: EmptyStateProps) {
  const buttonLabel = actionLabel || actionText;

  return (
    <div
      className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#f4f7f4] border border-[#dbe5dd] flex items-center justify-center text-[#6b7c72] mb-3">
        {icon || <FolderSearch className="w-6 h-6 text-[#225740]" />}
      </div>
      <h4 className="text-sm font-bold text-[#16382b] mb-1">{title}</h4>
      <p className="text-xs text-[#6b7c72] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {buttonLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
