import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: (SelectOption | string)[];
  leftIcon?: React.ReactNode;
}

export default function Select({
  label,
  error,
  helperText,
  options,
  leftIcon,
  children,
  id,
  className = "",
  disabled,
  ...props
}: SelectProps) {
  const selectId =
    id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
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

        <select
          id={selectId}
          disabled={disabled}
          className={`w-full h-10 px-3.5 pr-8 bg-white border text-xs sm:text-sm font-semibold rounded-xl appearance-none transition-all text-[#16382b] focus:outline-none cursor-pointer ${
            leftIcon ? "pl-9" : ""
          } ${
            error
              ? "border-[#d92d20] focus:ring-1 focus:ring-[#d92d20]"
              : "border-[#dbe5dd] focus:border-[#225740] focus:ring-1 focus:ring-[#225740]"
          } ${disabled ? "bg-gray-50 opacity-60 cursor-not-allowed" : ""} ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => {
                const value = typeof opt === "string" ? opt : opt.value;
                const optLabel = typeof opt === "string" ? opt : opt.label;
                return (
                  <option key={value} value={value}>
                    {optLabel}
                  </option>
                );
              })
            : children}
        </select>

        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
