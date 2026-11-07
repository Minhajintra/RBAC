import React from "react";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: React.ReactNode;
  description?: string;
}

export default function Checkbox({
  label,
  description,
  id,
  className = "",
  disabled,
  ...props
}: CheckboxProps) {
  const checkboxId =
    id ||
    (typeof label === "string"
      ? label.toLowerCase().replace(/\s+/g, "-")
      : undefined);

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-start gap-2 select-none ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <input
        type="checkbox"
        id={checkboxId}
        disabled={disabled}
        className="w-4 h-4 mt-0.5 rounded text-[#225740] accent-[#225740] focus:ring-[#225740] border-[#dbe5dd] cursor-pointer"
        {...props}
      />
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs font-medium text-[#16382b]">{label}</span>
          )}
          {description && (
            <span className="text-[11px] text-[#6b7c72]">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
