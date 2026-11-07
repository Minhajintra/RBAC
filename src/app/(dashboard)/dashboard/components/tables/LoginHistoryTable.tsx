"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Globe,
  Smartphone,
  Terminal,
  Cpu,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Loader,
  EmptyState,
  Badge,
  Button,
  Input,
  Select,
} from "@/components/ui";
import * as dashboardService from "../../actions/getDashboard";
import {
  LoginHistoryResponse,
  LoginHistoryRecord,
  LoginHistoryFilters,
} from "../../types/dashboard.types";

interface StatusBadgeProps {
  record: LoginHistoryRecord;
}

function StatusBadge({ record }: StatusBadgeProps) {
  if (record.status === "Success") {
    return (
      <Badge variant="success" dot>
        Success
      </Badge>
    );
  }

  if (record.status === "Failed") {
    return (
      <Badge
        variant="danger"
        dot
        title={record.failureReason || "Authentication failed"}
      >
        Failed
      </Badge>
    );
  }

  if (record.status === "MFA Required") {
    return (
      <Badge
        variant="warning"
        dot
        title={record.failureReason || "Secondary challenge pending"}
      >
        MFA Req.
      </Badge>
    );
  }

  if (record.status === "Blocked") {
    return (
      <Badge
        variant="neutral"
        dot
        title={record.failureReason || "Access blocked"}
      >
        Blocked
      </Badge>
    );
  }

  return null;
}

interface InterfaceIconProps {
  type: string;
}

function InterfaceIcon({ type }: InterfaceIconProps) {
  switch (type) {
    case "Web Portal":
      return <Globe className="w-3.5 h-3.5 text-[#225740]" />;
    case "Mobile App":
      return <Smartphone className="w-3.5 h-3.5 text-[#2563eb]" />;
    case "Admin CLI":
      return <Terminal className="w-3.5 h-3.5 text-[#7e22ce]" />;
    case "API Gateway":
      return <Cpu className="w-3.5 h-3.5 text-[#d97706]" />;
    default:
      return <Globe className="w-3.5 h-3.5 text-[#225740]" />;
  }
}

interface AuditFiltersBarProps {
  searchTerm: string;
  selectedStatus: string;
  selectedInterface: string;
  statusOptions: string[];
  interfaceOptions: string[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (val: string) => void;
  onInterfaceChange: (val: string) => void;
  onReset: () => void;
}

function AuditFiltersBar({
  searchTerm,
  selectedStatus,
  selectedInterface,
  statusOptions,
  interfaceOptions,
  onSearchChange,
  onStatusChange,
  onInterfaceChange,
  onReset,
}: AuditFiltersBarProps) {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedStatus !== "All Statuses" ||
    selectedInterface !== "All Interfaces";

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
      <div className="flex-1 max-w-md">
        <Input
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search by name, email, IP, location..."
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
          className="h-9 py-1.5 text-xs bg-[#f8faf8]"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="min-w-[130px]">
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            options={statusOptions}
            leftIcon={<Filter className="w-3.5 h-3.5 text-[#6b7c72]" />}
            className="h-9 py-1 bg-[#f8faf8] text-xs"
          />
        </div>

        <div className="min-w-[130px]">
          <Select
            value={selectedInterface}
            onChange={(e) => onInterfaceChange(e.target.value)}
            options={interfaceOptions}
            className="h-9 py-1 bg-[#f8faf8] text-xs"
          />
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs font-bold text-[#225740] px-2 py-1"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

interface AuditTableRowProps {
  record: LoginHistoryRecord;
}

function AuditTableRow({ record }: AuditTableRowProps) {
  return (
    <TableRow
      key={record.id}
      className="border-b border-[#f0f4f1] hover:bg-[#f8faf8] transition-colors"
    >
      <TableCell className="py-3.5 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#e6efe8] text-[#225740] font-bold text-xs flex items-center justify-center flex-shrink-0">
            {record.userInitials}
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#11261c] truncate">
              {record.userName}
            </span>
            <span className="block text-[10.5px] text-[#6b7c72] truncate">
              {record.userEmail}
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-3.5 px-4 text-xs font-medium text-[#16382b]">
        {record.userRole}
      </TableCell>

      <TableCell className="py-3.5 px-4">
        <div className="flex items-center gap-1.5 text-xs text-[#16382b]">
          <InterfaceIcon type={record.interface} />
          <span>{record.interface}</span>
        </div>
      </TableCell>

      <TableCell className="py-3.5 px-4">
        <div className="text-xs text-[#16382b] font-mono">
          {record.ipAddress}
        </div>
        <div className="text-[10.5px] text-[#6b7c72]">{record.location}</div>
      </TableCell>

      <TableCell className="py-3.5 px-4 text-xs text-[#465b50]">
        {record.device}
      </TableCell>

      <TableCell className="py-3.5 px-4 text-xs text-[#465b50] whitespace-nowrap">
        {record.timestamp}
      </TableCell>

      <TableCell className="py-3.5 px-4">
        <StatusBadge record={record} />
      </TableCell>
    </TableRow>
  );
}

interface LoginHistoryTableProps {
  data?: LoginHistoryResponse | null;
}

export function LoginHistoryTable({ data: initialData }: LoginHistoryTableProps) {
  const [data, setData] = useState<LoginHistoryResponse | null>(initialData || null);
  const [allLoadedRecords, setAllLoadedRecords] = useState<LoginHistoryRecord[]>(
    initialData?.records || [],
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedInterface, setSelectedInterface] = useState("All Interfaces");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Keep master store updated when initialData arrives
  useEffect(() => {
    if (initialData?.records && initialData.records.length > 0) {
      setAllLoadedRecords((prev) => {
        const map = new Map<string, LoginHistoryRecord>();
        prev.forEach((r) => map.set(r.id, r));
        initialData.records.forEach((r) => map.set(r.id, r));
        return Array.from(map.values());
      });
    }
  }, [initialData]);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: LoginHistoryFilters = {
        search: searchTerm,
        status: selectedStatus,
        interface: selectedInterface,
      };

      const res = await dashboardService.getLoginHistoryAction(filters, currentPage, pageSize);
      setData(res);
      if (res.records && res.records.length > 0) {
        setAllLoadedRecords((prev) => {
          const map = new Map<string, LoginHistoryRecord>();
          prev.forEach((r) => map.set(r.id, r));
          res.records.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit records.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedInterface, currentPage]);

  useEffect(() => {
    if (initialData && !searchTerm && selectedStatus === "All Statuses" && selectedInterface === "All Interfaces" && currentPage === 1) {
      setData(initialData);
      setIsLoading(false);
      return;
    }

    let isSubscribed = true;
    const filters: LoginHistoryFilters = {
      search: searchTerm,
      status: selectedStatus,
      interface: selectedInterface,
    };

    dashboardService
      .getLoginHistoryAction(filters, currentPage, pageSize)
      .then((res) => {
        if (isSubscribed) {
          setData(res);
          if (res.records && res.records.length > 0) {
            setAllLoadedRecords((prev) => {
              const map = new Map<string, LoginHistoryRecord>();
              prev.forEach((r) => map.set(r.id, r));
              res.records.forEach((r) => map.set(r.id, r));
              return Array.from(map.values());
            });
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(
            err instanceof Error ? err.message : "Failed to load audit records.",
          );
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [searchTerm, selectedStatus, selectedInterface, currentPage, initialData]);

  // Client-side instant resilient filtering
  const filteredRecords = React.useMemo(() => {
    let list = allLoadedRecords.length > 0 ? allLoadedRecords : (data?.records || []);

    if (selectedStatus && selectedStatus !== "All Statuses") {
      const s = selectedStatus.toLowerCase().replace(/[\s_-]+/g, "");
      list = list.filter((r) => {
        const rs = (r.status || "").toLowerCase().replace(/[\s_-]+/g, "");
        return rs === s || rs.includes(s) || s.includes(rs);
      });
    }

    if (selectedInterface && selectedInterface !== "All Interfaces") {
      const i = selectedInterface.toLowerCase().replace(/[\s_-]+/g, "");
      list = list.filter((r) => {
        const ri = (r.interface || "").toLowerCase().replace(/[\s_-]+/g, "");
        return ri === i || ri.includes(i);
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          r.userRole.toLowerCase().includes(q) ||
          r.ipAddress.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.device.toLowerCase().includes(q),
      );
    }

    return list;
  }, [allLoadedRecords, data?.records, selectedStatus, selectedInterface, searchTerm]);

  const totalRecordsCount = filteredRecords.length;
  const totalPagesCount = Math.max(1, Math.ceil(totalRecordsCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPagesCount);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const displayedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  const handleInterfaceChange = (val: string) => {
    setSelectedInterface(val);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("All Statuses");
    setSelectedInterface("All Interfaces");
    setCurrentPage(1);
  };

  const statusOptions = data?.filterOptions?.statusOptions || [
    "All Statuses",
    "Success",
    "Failed",
    "MFA Required",
    "Blocked",
  ];

  const interfaceOptions = data?.filterOptions?.interfaceOptions || [
    "All Interfaces",
    "Web Portal",
    "Mobile App",
    "Admin CLI",
    "API Gateway",
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e5ece7] shadow-sm overflow-hidden">
      {/* Table Header Section */}
      <div className="p-4 sm:p-6 border-b border-[#e5ece7]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#11261c]">
              {data?.title || "Recent Login Activity & Audit Logs"}
            </h3>
            <p className="text-xs text-[#6b7c72] mt-0.5">
              {data?.subtitle ||
                "Detailed record of all authentication events across interfaces"}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={fetchRecords}
            isLoading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="self-start sm:self-auto bg-[#f8faf8] hover:bg-[#eef3ef]"
          >
            Refresh
          </Button>
        </div>

        <AuditFiltersBar
          searchTerm={searchTerm}
          selectedStatus={selectedStatus}
          selectedInterface={selectedInterface}
          statusOptions={statusOptions}
          interfaceOptions={interfaceOptions}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onInterfaceChange={handleInterfaceChange}
          onReset={clearFilters}
        />
      </div>

      {isLoading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader text="Loading audit records..." />
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-xs text-[#b42318] mb-2">{error}</p>
          <button
            type="button"
            onClick={fetchRecords}
            className="text-xs font-bold text-[#225740] underline cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : displayedRecords.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No Login Records Found"
            description="No audit logs matched your active search or filter criteria."
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#e5ece7] bg-[#f8faf8]">
                <TableHead className="py-3 px-4 text-left text-[11px] font-bold text-[#6b7c72] uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-[11px] font-bold text-[#6b7c72] uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-[11px] font-bold text-[#6b7c72] uppercase tracking-wider">
                  Interface
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-[11px] font-bold text-[#6b7c72] uppercase tracking-wider">
                  IP / Location
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-[11px] font-bold text-[#6b7c72] uppercase tracking-wider">
                  Device
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-[11px] font-bold text-[#6b7c72] uppercase tracking-wider">
                  Time
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-[11px] font-bold text-[#6b7c72] uppercase tracking-wider">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRecords.map((record) => (
                <AuditTableRow key={record.id} record={record} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPagesCount > 1 && (
        <div className="p-4 border-t border-[#e5ece7] flex items-center justify-between">
          <span className="text-xs text-[#6b7c72]">
            Showing{" "}
            <b>
              {(safeCurrentPage - 1) * pageSize + 1}
              -
              {Math.min(
                safeCurrentPage * pageSize,
                totalRecordsCount,
              )}
            </b>{" "}
            of <b>{totalRecordsCount}</b> records
          </span>

          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPagesCount}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}

export default LoginHistoryTable;
