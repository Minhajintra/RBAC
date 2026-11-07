"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { exportAuditLogs } from "../actions/exportAuditLogs";
import { getAuditLogs } from "../actions/getAuditLogs";
import { getAuditStatsAction } from "../actions/getAuditStats";
import { AuditEvent, AuditStats } from "../types/audit.types";
import { computeAuditStats } from "@/services/audit.service";
import { usePermissions } from "@/context/permission-context";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import PageHeader from "./PageHeader";
import AuditFilters from "./AuditFilters";
import AuditLogsTable from "./AuditLogsTable";

interface AuditLogsModuleProps {
  initialEvents?: AuditEvent[] | null;
  initialStats?: AuditStats | null;
}

export function AuditLogsModule({
  initialEvents,
  initialStats,
}: AuditLogsModuleProps) {
  const { isVisible } = usePermissions();
  const [events, setEvents] = useState<AuditEvent[]>(initialEvents || []);
  const [stats, setStats] = useState<AuditStats | null>(initialStats || null);
  const [isLoading, setIsLoading] = useState(initialEvents === null || initialEvents === undefined);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All actions");
  const [resultFilter, setResultFilter] = useState("All results");
  const [dateRangeFilter, setDateRangeFilter] = useState("All dates");

  const dateRangeOptions = ["All dates", "Today", "Last 7 days", "Last 30 days"];

  // Pagination state (8 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, statsData] = await Promise.all([
        getAuditLogs({
          search,
          action: actionFilter,
          result: resultFilter,
          dateRange: dateRangeFilter,
        }),
        getAuditStatsAction(),
      ]);
      setEvents(data);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error("Failed to load audit logs from backend:", err);
      const errObj = err as { status?: number; message?: string };
      if (
        errObj?.status === 403 ||
        /forbidden|permission|access denied|403/i.test(errObj?.message || "")
      ) {
        setIsForbidden(true);
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : "Unable to connect to backend audit logs service. Please retry.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, resultFilter, dateRangeFilter]);

  useEffect(() => {
    if (
      initialEvents !== null &&
      initialEvents !== undefined &&
      !search &&
      actionFilter === "All actions" &&
      resultFilter === "All results" &&
      dateRangeFilter === "All dates"
    ) {
      setEvents(initialEvents);
      if (initialStats) setStats(initialStats);
      setIsLoading(false);
      return;
    }
    fetchLogs();
  }, [fetchLogs, initialEvents, initialStats, search, actionFilter, resultFilter, dateRangeFilter]);

  const actionOptions = useMemo(() => {
    const acts = Array.from(new Set(events.map((e) => e.action).filter(Boolean)));
    return ["All actions", ...acts];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        evt.actor.name.toLowerCase().includes(query) ||
        evt.actor.email.toLowerCase().includes(query) ||
        evt.action.toLowerCase().includes(query) ||
        evt.resource.primary.toLowerCase().includes(query) ||
        evt.resource.category.toLowerCase().includes(query);

      const matchAction =
        actionFilter === "All actions" || evt.action === actionFilter;
      const matchResult =
        resultFilter === "All results" || evt.result === resultFilter;

      return matchSearch && matchAction && matchResult;
    });
  }, [events, search, actionFilter, resultFilter]);

  const totalRecords = filteredEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, validCurrentPage, pageSize]);

  const displayStats: AuditStats = useMemo(() => {
    if (stats) return stats;
    return computeAuditStats(events);
  }, [stats, events]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportAuditLogs({
        search,
        action: actionFilter,
        result: resultFilter,
        dateRange: dateRangeFilter,
      });

      const blob = new Blob([res.csvContent || ""], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(res.message);
    } catch {
      showToast("Failed to export audit logs from backend.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isForbidden || !isVisible("audit")) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="You do not have permission to inspect system audit logs. Contact your IntraShip administrator."
          backHref="/dashboard"
          backLabel="Return to Dashboard"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 sm:right-8 z-50 flex items-center gap-2 bg-[#1b4332] text-white px-4 py-3 rounded-xl shadow-lg border border-[#2d5f47] text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#8da882]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Heading & Export Button */}
      <PageHeader onExport={handleExport} isExporting={isExporting} />

      {/* 4 Stat / KPI Cards Grid derived from real backend audit logs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Audit Events */}
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#eaf3ed] flex items-center justify-center text-[#1b4332] mb-3">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-[#6b7c72]">
              Audit Events
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#16382b]">
                {displayStats.totalEvents.value}
              </span>
              <span className="text-xs font-bold text-[#1e4d3a]">
                {displayStats.totalEvents.badge}
              </span>
            </div>
          </div>
          <div className="text-xs text-[#6b7c72] mt-2">
            {displayStats.totalEvents.subtitle}
          </div>
        </div>

        {/* Card 2: Successful events */}
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#eaf3ed] flex items-center justify-center text-[#1b4332] mb-3">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-[#6b7c72]">
              Successful events
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#16382b]">
                {displayStats.successfulEvents.value}
              </span>
              <span className="text-xs font-bold text-[#1e4d3a]">
                {displayStats.successfulEvents.badge}
              </span>
            </div>
          </div>
          <div className="text-xs text-[#6b7c72] mt-2">
            {displayStats.successfulEvents.subtitle}
          </div>
        </div>

        {/* Card 3: Failed events */}
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#eaf3ed] flex items-center justify-center text-[#1b4332] mb-3">
              <X className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-[#6b7c72]">
              Failed events
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#16382b]">
                {displayStats.failedEvents.value}
              </span>
              <span className="text-xs font-bold text-[#1e4d3a]">
                {displayStats.failedEvents.badge}
              </span>
            </div>
          </div>
          <div className="text-xs text-[#6b7c72] mt-2">
            {displayStats.failedEvents.subtitle}
          </div>
        </div>

        {/* Card 4: Events today */}
        <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-[#eaf3ed] flex items-center justify-center text-[#1b4332] mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-[#6b7c72]">
              Events today
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#16382b]">
                {displayStats.eventsToday.value}
              </span>
              <span className="text-xs font-bold text-[#1e4d3a]">
                {displayStats.eventsToday.badge}
              </span>
            </div>
          </div>
          <div className="text-xs text-[#6b7c72] mt-2">
            {displayStats.eventsToday.subtitle}
          </div>
        </div>
      </div>

      {/* Event History Main Card */}
      <div className="bg-white rounded-2xl border border-[#e5ebe7] p-5 sm:p-6 shadow-xs">
        <AuditFilters
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          actionFilter={actionFilter}
          onActionFilterChange={(val) => {
            setActionFilter(val);
            setCurrentPage(1);
          }}
          actionOptions={actionOptions}
          resultFilter={resultFilter}
          onResultFilterChange={(val) => {
            setResultFilter(val);
            setCurrentPage(1);
          }}
          dateRangeFilter={dateRangeFilter}
          onDateRangeFilterChange={(val) => {
            setDateRangeFilter(val);
            setCurrentPage(1);
          }}
          dateRangeOptions={dateRangeOptions}
        />

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchLogs}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <AuditLogsTable
          events={paginatedEvents}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalRecords}
          displayTotalRecords={totalRecords}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          onClearFilters={() => {
            setSearch("");
            setActionFilter("All actions");
            setResultFilter("All results");
            setDateRangeFilter("All dates");
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}

export default AuditLogsModule;
