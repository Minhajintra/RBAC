import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  className = "",
  disabled,
  ...props
}: InputProps) {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#16382b] mb-1 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          className={`w-full h-10 px-3 py-2 bg-white border text-sm rounded-xl transition-all text-[#16382b] placeholder:text-gray-400 focus:outline-none ${
            leftIcon ? "pl-9" : ""
          } ${rightIcon ? "pr-9" : ""} ${
            error
              ? "border-[#d92d20] focus:ring-1 focus:ring-[#d92d20]"
              : "border-[#dbe5dd] focus:border-[#225740] focus:ring-2 focus:ring-[#225740]/20"
          } ${disabled ? "bg-gray-50 opacity-60 cursor-not-allowed" : ""} ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-[11px] text-[#d92d20] font-medium leading-tight">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-[#6b7c72]">{helperText}</p>
      ) : null}
    </div>
  );
}
