"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui";
import { ShieldCheck, Clock, KeySquare, Activity } from "lucide-react";
import { getSecurityOverview } from "../actions/getSecurityOverview";
import { SecurityOverviewData } from "@/services/dashboard.service";

interface SecurityWidgetProps {
  data?: SecurityOverviewData | null;
}

export function SecurityWidget({ data: initialData }: SecurityWidgetProps) {
  const [overview, setOverview] = useState<SecurityOverviewData>(
    initialData || {
      title: "Security Overview",
      mfaAdoptionRate: "100%",
      activeSessions: 1,
      passwordPolicy: "Strict (12+ char)",
      sessionTimeout: "30 minutes idle timeout",
      lastAuditExport: "Active",
    },
  );
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;

    let isMounted = true;
    getSecurityOverview()
      .then((data) => {
        if (isMounted) {
          setOverview(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Security overview fetch failed:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#225740] flex-shrink-0" />
            <h3 className="text-sm font-bold text-[#16382b]">
              {overview.title}
            </h3>
          </div>
          <span className="text-[10.5px] font-semibold text-[#6b7c72]">
            {overview.lastAuditExport}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="p-2.5 rounded-xl bg-[#f8faf8] border border-[#eef3ef] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e4d3a]">
              <Activity className="w-4 h-4 text-[#225740]" />
              <span>2FA Adoption</span>
            </div>
            <span className="text-sm font-extrabold text-[#11261c]">
              {isLoading ? "..." : overview.mfaAdoptionRate}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#f8faf8] border border-[#eef3ef] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e4d3a]">
              <Clock className="w-4 h-4 text-[#225740]" />
              <span>Active Sessions</span>
            </div>
            <span className="text-sm font-extrabold text-[#11261c]">
              {isLoading ? "..." : `${overview.activeSessions} Active`}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#f8faf8] border border-[#eef3ef] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e4d3a]">
              <KeySquare className="w-4 h-4 text-[#225740]" />
              <span>Password Policy</span>
            </div>
            <span className="text-xs font-bold text-[#11261c]">
              {overview.passwordPolicy}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#eef3ef] text-[10.5px] text-[#6b7c72]">
        Idle Session Timeout: <b>{overview.sessionTimeout}</b>
      </div>
    </Card>
  );
}

export default SecurityWidget;

