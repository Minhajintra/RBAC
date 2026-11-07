"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "@/components/ui/ChartCard";
import { getLoginAttempts } from "../../actions/getLoginAttempts";
import {
  LoginAttemptsResponse,
  LoginAttemptsPeriod,
} from "../../types/dashboard.types";

interface LoginAttemptsChartProps {
  data?: LoginAttemptsResponse | null;
}

export function LoginAttemptsChart({ data: initialData }: LoginAttemptsChartProps) {
  const [period, setPeriod] = useState<LoginAttemptsPeriod>("daily");
  const [data, setData] = useState<LoginAttemptsResponse | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = async (selectedPeriod: LoginAttemptsPeriod) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getLoginAttempts(selectedPeriod);
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load login attempts.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If initialData is provided and period is daily, don't refetch on first mount
    if (initialData && period === "daily") {
      setData(initialData);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    getLoginAttempts(period)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load attempts.",
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [period, initialData]);

  const handlePeriodChange = (newPeriod: LoginAttemptsPeriod) => {
    setPeriod(newPeriod);
    fetchAttempts(newPeriod);
  };

  const timeframeControls = (
    <div className="flex items-center gap-1 bg-[#f0f4f1] p-1 rounded-xl">
      <button
        type="button"
        onClick={() => handlePeriodChange("daily")}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
          period === "daily"
            ? "bg-white text-[#16382b] shadow-2xs"
            : "text-[#6b7c72] hover:text-[#16382b]"
        }`}
      >
        Daily
      </button>

      <button
        type="button"
        onClick={() => handlePeriodChange("monthly")}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
          period === "monthly"
            ? "bg-white text-[#16382b] shadow-2xs"
            : "text-[#6b7c72] hover:text-[#16382b]"
        }`}
      >
        Monthly
      </button>
    </div>
  );

  return (
    <ChartCard
      title="Login Attempts"
      subtitle={
        period === "daily"
          ? "Daily authentication volume across 7 days"
          : "Monthly overview of access attempts"
      }
      actions={timeframeControls}
      isLoading={isLoading}
      error={error}
      onRetry={() => fetchAttempts(period)}
      isEmpty={!data || (data.chartData?.length || 0) === 0}
      emptyMessage="No login attempt records recorded for this timeframe."
    >
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data?.chartData || []}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#eef3ef"
              vertical={false}
            />

            <XAxis
              dataKey="period"
              stroke="#6b7c72"
              fontSize={11}
              tickLine={false}
              interval={0}
              axisLine={{ stroke: "#e5ece7" }}
            />

            <YAxis
              stroke="#6b7c72"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            />

            <Tooltip
              cursor={{ fill: "#f8faf8" }}
              formatter={(val: unknown, name: unknown) => [
                Number(val || 0).toLocaleString(),
                String(name || "Logins"),
              ]}
              labelFormatter={(label) => `Period: ${label}`}
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e5ece7",
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: "12px", fontSize: "11px" }}
            />

            <Bar
              dataKey="successful"
              name="Success"
              fill="#225740"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />

            <Bar
              dataKey="failed"
              name="Failed"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#eef3ef] text-[11px] text-[#6b7c72]">
          <span>
            Total Volume: <b>{((data.totalSuccessful || 0) + (data.totalFailed || 0)).toLocaleString()} attempts</b>
          </span>
          <span className="text-[#225740] font-bold">
            Success Rate: {String(data.successRate || "0%").replace(/%+$/, "")}%
          </span>
        </div>
      )}
    </ChartCard>
  );
}

export default LoginAttemptsChart;
