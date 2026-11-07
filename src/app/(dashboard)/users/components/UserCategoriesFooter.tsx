"use client";

import React from "react";
import { UserStats } from "../types/user.types";

interface UserCategoriesFooterProps {
  stats: UserStats;
}

export default function UserCategoriesFooter({
  stats,
}: UserCategoriesFooterProps) {
  const { teachers, administrators, supportStaff, other } = stats.roleCounts;

  return (
    <div className="space-y-4">
      <div className="bg-[#edf2ee] rounded-2xl p-4 sm:p-5 border border-[#dbe5dd] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
        <span className="font-extrabold text-[#11261c] text-sm">
          User categories
        </span>

        <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs font-semibold text-[#16382b]">
          <div>
            <span className="text-[#6b7c72] mr-1.5 font-medium">Teachers</span>
            <span className="font-extrabold text-[#11261c]">{teachers}</span>
          </div>

          <div>
            <span className="text-[#6b7c72] mr-1.5 font-medium">
              Administrators
            </span>
            <span className="font-extrabold text-[#11261c]">
              {administrators}
            </span>
          </div>

          <div>
            <span className="text-[#6b7c72] mr-1.5 font-medium">
              Support staff
            </span>
            <span className="font-extrabold text-[#11261c]">
              {supportStaff}
            </span>
          </div>

          <div>
            <span className="text-[#6b7c72] mr-1.5 font-medium">Other</span>
            <span className="font-extrabold text-[#11261c]">{other}</span>
          </div>
        </div>
      </div>

      <footer className="pt-1 pb-4 text-center text-[10.5px] sm:text-xs text-[#6b7c72]">
        IntraShip UAM • Users concept • Sample data for design preview
      </footer>
    </div>
  );
}
