"use client";

import React from "react";
import { Pagination } from "@/components/ui";

interface UserPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export default function UserPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: UserPaginationProps) {
  if (total === 0) return null;

  return (
    <Pagination
      page={page}
      pageSize={pageSize}
      total={total}
      totalPages={totalPages}
      recordLabel="users"
      showTextButtons={true}
      onPageChange={onPageChange}
      className="border-none px-0 pt-3 mt-1"
    />
  );
}
