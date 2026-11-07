import React from "react";

export function Table({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <table
        className={`w-full border-collapse text-left text-xs ${className}`}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={`bg-[#e6efe8]/60 text-[#16382b] border-b border-[#dbe5dd] ${className}`}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tbody className={`divide-y divide-[#eef3ef] ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-[#f8faf8] transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-bold tracking-wider uppercase text-[#55695e] whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 text-xs text-[#16382b] align-middle ${className}`}
    >
      {children}
    </td>
  );
}
