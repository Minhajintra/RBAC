import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import Input, { InputProps } from "./Input";

export type PasswordInputProps = Omit<
  InputProps,
  "type" | "leftIcon" | "rightIcon"
>;

export default function PasswordInput({ ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      type={showPassword ? "text" : "password"}
      leftIcon={<Lock className="w-4 h-4" />}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="p-1 hover:text-[#16382b] transition-colors focus:outline-none cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      }
      {...props}
    />
  );
}
