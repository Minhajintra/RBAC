"use client";

import React from "react";
import { User, Check, ArrowUpRight, Clock } from "lucide-react";
import { Card } from "@/components/ui";
import { UserStats } from "../types/user.types";

interface UserStatsCardsProps {
  stats: UserStats;
}

export default function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Total Users */}
      <Card className="hover:shadow-sm transition-all flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#e6efe8] text-[#225740] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-[#225740]">
            {stats.totalGrowth}
          </span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-[#6b7c72] mb-0.5">
            Total Users
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#11261c] tracking-tight">
            {stats.totalUsers}
          </span>
          <p className="text-[10.5px] text-[#6b7c72] mt-0.5 font-medium">
            vs. last month
          </p>
        </div>
      </Card>

      {/* 2. Active users */}
      <Card className="hover:shadow-sm transition-all flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#e6efe8] text-[#225740] flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-[#225740]">
            {stats.activePercent}
          </span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-[#6b7c72] mb-0.5">
            Active users
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#11261c] tracking-tight">
            {stats.activeUsers}
          </span>
          <p className="text-[10.5px] text-[#6b7c72] mt-0.5 font-medium">
            of all workspace users
          </p>
        </div>
      </Card>

      {/* 3. Pending invitations */}
      <Card className="hover:shadow-sm transition-all flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#e6efe8] text-[#225740] flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-[#225740]">Awaiting</span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-[#6b7c72] mb-0.5">
            Pending invitations
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#11261c] tracking-tight">
            {stats.pendingInvitations}
          </span>
          <p className="text-[10.5px] text-[#6b7c72] mt-0.5 font-medium">
            invitations to accept
          </p>
        </div>
      </Card>

      {/* 4. Inactive users */}
      <Card className="hover:shadow-sm transition-all flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#e6efe8] text-[#225740] flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-[#225740]">Review</span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-[#6b7c72] mb-0.5">
            Inactive users
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#11261c] tracking-tight">
            {stats.inactiveUsers}
          </span>
          <p className="text-[10.5px] text-[#6b7c72] mt-0.5 font-medium">
            accounts without active access
          </p>
        </div>
      </Card>
    </div>
  );
}
