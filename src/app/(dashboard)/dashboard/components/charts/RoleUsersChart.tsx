"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import ChartCard from "@/components/ui/ChartCard";
import { getRoleUsers } from "../../actions/getRoleUsers";
import { RoleUsersResponse, RoleUserItem } from "../../types/dashboard.types";

interface RoleLegendItemProps {
  role: RoleUserItem;
}

function RoleLegendItem({ role }: RoleLegendItemProps) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl hover:bg-[#f8faf8] transition-colors gap-3 w-full">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: role.color }}
        />
        <span className="text-xs font-semibold text-[#16382b]">
          {role.name}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-xs font-extrabold text-[#11261c] tabular-nums">
          {role.count.toLocaleString()}
        </span>
        <span className="text-[10.5px] font-bold text-[#6b7c72] w-8 text-right tabular-nums">
          {role.percent}%
        </span>
      </div>
    </div>
  );
}

interface RoleUsersChartProps {
  data?: RoleUsersResponse | null;
}

export function RoleUsersChart({ data: initialData }: RoleUsersChartProps) {
  const [data, setData] = useState<RoleUsersResponse | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;

    let isMounted = true;
    getRoleUsers()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load role distribution.",
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  return (
    <ChartCard
      title="Users by Assigned Role"
      subtitle="Headcount across security categories"
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.roles.length === 0}
      emptyMessage="No role assignment data available."
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-2">
        <div className="w-48 h-48 sm:w-44 sm:h-44 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.roles || []}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={3}
              >
                {(data?.roles || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5ece7",
                  fontSize: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-black text-[#11261c] leading-none">
              {data?.totalUsers?.toLocaleString() || "0"}
            </span>
            <span className="text-[10px] font-bold text-[#6b7c72] uppercase tracking-wider mt-0.5">
              Users
            </span>
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col justify-center divide-y divide-[#f2f6f3]">
          {(data?.roles || []).map((role) => (
            <RoleLegendItem key={role.name} role={role} />
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

export default RoleUsersChart;
