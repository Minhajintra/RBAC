"use client";

import React, { useEffect, useState } from "react";
import { Globe, Smartphone, Terminal, Cpu } from "lucide-react";
import ChartCard from "@/components/ui/ChartCard";
import { getInterfaceAccess } from "../../actions/getInterfaceAccess";
import {
  InterfaceAccessResponse,
  InterfaceAccessItem,
} from "../../types/dashboard.types";

interface InterfaceIconProps {
  name: string;
}

function InterfaceIcon({ name }: InterfaceIconProps) {
  const normalized = name.toLowerCase();
  if (normalized.includes("web"))
    return <Globe className="w-4 h-4 text-[#225740]" />;
  if (normalized.includes("mobile"))
    return <Smartphone className="w-4 h-4 text-[#2563eb]" />;
  if (normalized.includes("cli") || normalized.includes("admin"))
    return <Terminal className="w-4 h-4 text-[#7e22ce]" />;
  return <Cpu className="w-4 h-4 text-[#d97706]" />;
}

interface InterfaceTrafficRowProps {
  item: InterfaceAccessItem;
}

function InterfaceTrafficRow({ item }: InterfaceTrafficRowProps) {
  return (
    <div className="p-2.5 sm:p-3 rounded-xl bg-[#f8faf8] border border-[#eef3ef] hover:border-[#dbe5dd] transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#e5ece7] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <InterfaceIcon name={item.name} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#16382b] leading-tight">
              {item.name}
            </h4>
            <p className="text-[10.5px] text-[#6b7c72]">{item.description}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm font-extrabold text-[#11261c]">
            {item.count.toLocaleString()}
          </span>
          <span className="text-[10.5px] font-bold text-[#225740] ml-1.5">
            {item.percent}%
          </span>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-[#e5ece7] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, item.percent)}%`,
            backgroundColor: item.color || "#225740",
          }}
        />
      </div>
    </div>
  );
}

interface InterfaceAccessChartProps {
  data?: InterfaceAccessResponse | null;
}

export function InterfaceAccessChart({ data: initialData }: InterfaceAccessChartProps) {
  const [data, setData] = useState<InterfaceAccessResponse | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    let isMounted = true;
    getInterfaceAccess()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load interfaces.",
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
      title="Traffic by Client Interface"
      subtitle="Client channel access distribution"
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.interfaces.length === 0}
      emptyMessage="No interface traffic data available."
    >
      <div className="space-y-2.5 pt-1">
        {(data?.interfaces || []).map((item) => (
          <InterfaceTrafficRow key={item.name} item={item} />
        ))}
      </div>
    </ChartCard>
  );
}

export default InterfaceAccessChart;
