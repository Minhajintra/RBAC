"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import {
  SecuritySettingsData,
  PasswordPolicyData,
} from "../types/security.types";
import { saveSecuritySettingsAction } from "../actions/saveSecuritySettings";
import { triggerGlobalLogoutAction } from "../actions/triggerGlobalLogout";
import { usePermissions } from "@/context/permission-context";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import SessionTimeoutsCard from "./SessionTimeoutsCard";
import PasswordPolicyCard from "./PasswordPolicyCard";
import GlobalLogoutCard from "./GlobalLogoutCard";
import ConfirmGlobalLogoutCard from "./ConfirmGlobalLogoutCard";
import PasswordConfigurationTab from "./PasswordConfigurationTab";

interface SecuritySettingsModuleProps {
  initialSettings: SecuritySettingsData;
  initialPasswordPolicy: PasswordPolicyData;
}

/**
 * Security Settings Orchestrator Module (FG-UAM-16)
 */
export function SecuritySettingsModule({
  initialSettings,
  initialPasswordPolicy,
}: SecuritySettingsModuleProps) {
  const { isVisible } = usePermissions();

  // State initialized from separate mock data
  const [settings, setSettings] = useState<SecuritySettingsData>(initialSettings);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicyData>(
    initialPasswordPolicy,
  );

  // Active tab state
  const [activeTab, setActiveTab] = useState<"settings" | "password-config">("settings");

  // Interaction & feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Handlers for session timeouts
  const handleWebTimeoutChange = (val: string) => {
    setSettings((prev) => ({ ...prev, webSessionTimeout: val }));
  };

  const handleMobileTimeoutChange = (val: string) => {
    setSettings((prev) => ({ ...prev, mobileSessionTimeout: val }));
  };

  // Handler for password complexity toggle
  const handleComplexityToggle = () => {
    setSettings((prev) => ({
      ...prev,
      passwordComplexity: !prev.passwordComplexity,
    }));
  };

  // Handler for saving changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await saveSecuritySettingsAction(settings, passwordPolicy);
      showToast(res.message || "Security settings saved successfully.", "success");
    } catch {
      showToast("Failed to save security settings. Please retry.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for Global Logout
  const handleConfirmGlobalLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await triggerGlobalLogoutAction();
      setSettings((prev) => ({
        ...prev,
        activeSessions: 0,
        lastGlobalLogout: new Date().toISOString(),
      }));
      showToast(res.message, "success");
    } catch {
      showToast("Unable to execute global logout at this time.", "error");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancelGlobalLogout = () => {
    showToast("Global logout operation cancelled.", "info");
  };

  // Permission authorization check
  if (!isVisible("settings")) {
    return (
      <div className="p-6">
        <ForbiddenState
          title="Access Denied"
          description="You do not have permission to access system security settings. Please contact an IntraShip administrator."
          backHref="/dashboard"
          backLabel="Return to Dashboard"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-4 sm:right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm animate-in fade-in slide-in-from-top-2 ${
            toast.type === "error"
              ? "bg-[#991b1b] text-white border-red-700"
              : toast.type === "info"
                ? "bg-[#1f2937] text-white border-gray-700"
                : "bg-[#1b4332] text-white border-[#2d5f47]"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-white" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#8da882]" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Page Header matching FG-UAM-16 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#16382b] tracking-tight leading-tight">
            Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7c72] mt-1">
            System-wide session and password policy. MFA and device binding are user-level settings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#16382b] hover:bg-[#11261c] text-white text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60 self-start sm:self-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>

      {/* Tabs matching FG-UAM-16 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "settings"
              ? "bg-white text-[#16382b] border border-[#e5ebe7] shadow-xs"
              : "text-[#6b7c72] hover:text-[#16382b] hover:bg-white/50"
          }`}
        >
          Security Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("password-config")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "password-config"
              ? "bg-white text-[#16382b] border border-[#e5ebe7] shadow-xs"
              : "text-[#6b7c72] hover:text-[#16382b] hover:bg-white/50"
          }`}
        >
          Password Configuration
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "settings" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column (Cards 1, 2, 3) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Card 1: Session timeouts */}
            <SessionTimeoutsCard
              webTimeout={settings.webSessionTimeout}
              onWebTimeoutChange={handleWebTimeoutChange}
              webOptions={settings.webSessionTimeoutOptions}
              mobileTimeout={settings.mobileSessionTimeout}
              onMobileTimeoutChange={handleMobileTimeoutChange}
              mobileOptions={settings.mobileSessionTimeoutOptions}
            />

            {/* Card 2: Password policy */}
            <PasswordPolicyCard
              complexityEnabled={settings.passwordComplexity}
              onComplexityToggle={handleComplexityToggle}
              configuredPolicyText={settings.configuredPolicyText}
              onOpenPasswordConfig={() => setActiveTab("password-config")}
            />

            {/* Card 3: Global logout */}
            <GlobalLogoutCard
              onOpenConfirm={() => {
                const element = document.getElementById("confirm-global-logout-card");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              isLoggingOut={isLoggingOut}
            />
          </div>

          {/* Right Column: Confirm global logout card matching FG-UAM-16 */}
          <div id="confirm-global-logout-card" className="lg:col-span-4">
            <ConfirmGlobalLogoutCard
              onCancel={handleCancelGlobalLogout}
              onConfirm={handleConfirmGlobalLogout}
              isLoggingOut={isLoggingOut}
            />
          </div>
        </div>
      ) : (
        /* Password Configuration Tab */
        <PasswordConfigurationTab
          policy={passwordPolicy}
          onChange={(updated) =>
            setPasswordPolicy((prev) => ({ ...prev, ...updated }))
          }
          onBackToSettings={() => setActiveTab("settings")}
        />
      )}
    </div>
  );
}

export default SecuritySettingsModule;

