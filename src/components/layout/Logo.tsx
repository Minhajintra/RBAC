import React from "react";
import Link from "next/link";

interface LogoProps {
  light?: boolean;
  href?: string;
}

// brand logo with circular 'I' badge
const Logo = ({ light = false, href = "/dashboard" }: LogoProps) => {
  return (
    <Link href={href} className="inline-flex items-center gap-3 group">
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg text-white shadow-sm bg-[#225740] flex-shrink-0">
        I
      </div>

      <div className="flex flex-col">
        <span
          className={`font-bold text-lg leading-tight tracking-tight ${
            light ? "text-white" : "text-[#16382b]"
          }`}
        >
          IntraShip
        </span>
        <span
          className={`text-[10px] tracking-widest font-semibold uppercase ${
            light ? "text-[#a3b899]" : "text-[#6b7c72]"
          }`}
        >
          Access Portal
        </span>
      </div>
    </Link>
  );
};

export default Logo;
