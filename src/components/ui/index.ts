// Basic class name helper adjusted directly with UI components
export const cn = (...cls: (string | undefined | null | false)[]) => {
  return cls.filter(Boolean).join(" ").trim();
};

export { default as Alert } from "./Alert";
export type { AlertProps } from "./Alert";

export { default as Button } from "./Button";
export type { ButtonProps } from "./Button";

export { default as Badge } from "./Badge";
export type { BadgeProps, BadgeVariant } from "./Badge";

export { default as Card } from "./Card";
export type { CardProps } from "./Card";

export { default as ChartCard } from "./ChartCard";
export type { ChartCardProps } from "./ChartCard";

export { default as Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";

export { default as EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { default as Input } from "./Input";
export type { InputProps } from "./Input";

export { default as Loader } from "./Loader";
export type { LoaderProps } from "./Loader";

export { default as Modal } from "./Modal";
export type { ModalProps } from "./Modal";

export { default as Pagination } from "./Pagination";
export type { PaginationProps } from "./Pagination";

export { default as PasswordInput } from "./PasswordInput";
export type { PasswordInputProps } from "./PasswordInput";

export { default as Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./Table";

export { default as Toast } from "./Toast";
export type { ToastProps } from "./Toast";

export { PermissionGuard } from "./PermissionGuard";
export { ForbiddenState } from "./ForbiddenState";
