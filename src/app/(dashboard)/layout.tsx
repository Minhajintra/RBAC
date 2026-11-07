"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PermissionProvider } from "@/context/permission-context";
import { authStorage } from "@/lib/auth-storage";

/**
 * Dashboard Route Layout Shell
 * Establishes the RBAC PermissionProvider, responsive Sidebar, top Header, and global Footer.
 * Actively monitors backend availability: jasay hi server band ho, foran login page per redirect hojay.
 */
export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check active authenticated session on dashboard mount
  useEffect(() => {
    let isMounted = true;

    async function checkBackendStatus() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 401) {
            authStorage.clear();
            if (isMounted) {
              router.push("/login");
            }
            return;
          }

          const data = await res.json().catch(() => ({}));
          if (data.serverOffline) {
            authStorage.clear();
            if (isMounted) {
              router.push("/login?error=server_offline");
            }
          }
        } else {
          const data = await res.json().catch(() => ({}));
          if (!data.success || !data.user) {
            authStorage.clear();
            if (isMounted) {
              router.push("/login");
            }
          }
        }
      } catch {
        // Network error - do not aggressively kick user to login?error=server_offline
      }
    }

    checkBackendStatus();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <PermissionProvider>
      <div className="min-h-screen bg-[#f3f7f4] font-sans text-[#16382b]">
        {/* Responsive Sidebar Navigation */}
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 md:pl-64">
          <Header onOpenMobileSidebar={() => setMobileOpen(true)} />

          <main className="flex-1 p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </PermissionProvider>
  );
}
