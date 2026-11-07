"use client";

import React, { useState, useMemo } from "react";
import { Modal, Button } from "@/components/ui";
import { User } from "../types/user.types";
import { scopeService } from "@/services/scope.service";
import { UserScopeAssignmentRequest, ScopeProvince, ScopeWorkspace } from "@/types/scope.types";
import { Check, ShieldCheck, MapPin } from "lucide-react";

interface UserScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  selectedUser?: User | null;
  onSuccess?: (message: string) => void;
}

export default function UserScopeModal({
  isOpen,
  onClose,
  users,
  selectedUser,
  onSuccess,
}: UserScopeModalProps) {
  const [provinces, setProvinces] = useState<ScopeProvince[]>([]);
  const [workspaces] = useState<ScopeWorkspace[]>([
    { id: "ws-default", name: "Default Workspace" },
  ]);

  // Form states
  const [userId, setUserId] = useState<string>(selectedUser?.id || users[0]?.id || "");
  const [role, setRole] = useState<string>(selectedUser?.role || "Teacher");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [subDistrict, setSubDistrict] = useState<string>("");
  const [site, setSite] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real boundaries from backend API when modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    scopeService
      .getBoundaries()
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setProvinces(data);
            setProvince(data[0].name);
          } else {
            setProvinces([]);
          }
        }
      })
      .catch((err) => {
        console.error("[UserScopeModal] Failed to fetch boundaries:", err);
        if (isMounted) {
          setProvinces([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Cascading regions
  const currentProvinceObj = useMemo(
    () => provinces.find((p) => p.name === province) || provinces[0],
    [provinces, province],
  );

  const availableRegions = useMemo(
    () => currentProvinceObj?.regions || [],
    [currentProvinceObj],
  );

  const currentRegionObj = useMemo(
    () => availableRegions.find((r) => r.name === region) || availableRegions[0],
    [availableRegions, region],
  );

  const availableDistricts = useMemo(
    () => currentRegionObj?.districts || [],
    [currentRegionObj],
  );

  const currentDistrictObj = useMemo(
    () => availableDistricts.find((d) => d.name === district) || availableDistricts[0],
    [availableDistricts, district],
  );

  const availableSubDistricts = useMemo(
    () => currentDistrictObj?.sub_districts || [],
    [currentDistrictObj],
  );

  const currentSubDistrictObj = useMemo(
    () => availableSubDistricts.find((s) => s.name === subDistrict) || availableSubDistricts[0],
    [availableSubDistricts, subDistrict],
  );

  const availableSites = useMemo(
    () => currentSubDistrictObj?.sites || [],
    [currentSubDistrictObj],
  );

  // Sync when selectedUser changes
  React.useEffect(() => {
    if (selectedUser) {
      setUserId(selectedUser.id);
      setRole(selectedUser.role);
    }
  }, [selectedUser]);

  // Set default initial cascading values
  React.useEffect(() => {
    if (availableRegions[0] && !region) {
      setRegion(availableRegions[0].name);
    }
  }, [availableRegions, region]);

  React.useEffect(() => {
    if (availableDistricts[0] && !district) {
      setDistrict(availableDistricts[0].name);
    }
  }, [availableDistricts, district]);

  React.useEffect(() => {
    if (availableSubDistricts[0] && !subDistrict) {
      setSubDistrict(availableSubDistricts[0].name);
    }
  }, [availableSubDistricts, subDistrict]);

  React.useEffect(() => {
    if (availableSites[0] && !site) {
      setSite(availableSites[0].name);
    }
  }, [availableSites, site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("Please select a user to assign jurisdictional scope.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: UserScopeAssignmentRequest = {
      user_id: userId,
      role: role || "Teacher",
      workspace_id: workspaceId || workspaces[0]?.id || "default",
      province: province || provinces[0]?.name || "",
      region: region || availableRegions[0]?.name || "",
      district: district || availableDistricts[0]?.name || "",
      sub_district: subDistrict || availableSubDistricts[0]?.name || "",
      site: site || availableSites[0]?.name || "",
    };

    try {
      const res = await scopeService.assignUserScope(userId, payload);
      onSuccess?.(res.message || "Jurisdictional scope assigned successfully.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign scope.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Scope Assignment"
      subtitle="Configure organizational role and jurisdictional hierarchy boundaries."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#f8faf8] border border-[#eef3ef] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eef5f0] flex items-center justify-center text-[#1b4332] flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#16382b]">
              Scope Security Protocol
            </div>
            <div className="text-[11px] text-[#6b7c72]">
              User data access will be strictly restricted to the assigned geographical site and district.
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-xs font-bold text-[#16382b] mb-1">
            User Selection *
          </label>
          <select
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              const found = users.find((u) => u.id === e.target.value);
              if (found) setRole(found.role);
            }}
            className="w-full h-10 px-3 bg-white border border-[#d1ded6] text-xs sm:text-sm rounded-xl text-[#16382b] focus:outline-none focus:border-[#1b4332] cursor-pointer"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email}) — {u.role}
              </option>
            ))}
          </select>
        </div>

        {/* Role & Workspace Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#16382b] mb-1">
              Role Selection *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#d1ded6] text-xs sm:text-sm rounded-xl text-[#16382b] focus:outline-none focus:border-[#1b4332] cursor-pointer"
            >
              <option value="Administrator">Administrator</option>
              <option value="Teacher">Teacher</option>
              <option value="Support staff">Support staff</option>
              <option value="Quality Auditor">Quality Auditor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16382b] mb-1">
              Workspace Selection *
            </label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#d1ded6] text-xs sm:text-sm rounded-xl text-[#16382b] focus:outline-none focus:border-[#1b4332] cursor-pointer"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Jurisdictional Hierarchy Separator */}
        <div className="pt-2 border-t border-[#eef3ef] flex items-center gap-2 text-xs font-bold text-[#1e4d3a]">
          <MapPin className="w-4 h-4 text-[#225740]" />
          <span>Geographical Scope Hierarchy</span>
        </div>

        {/* Province & Region */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#55695e] mb-1">
              Province *
            </label>
            <select
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                const foundProv = provinces.find((p) => p.name === e.target.value);
                const firstReg = foundProv?.regions[0]?.name || "";
                setRegion(firstReg);
              }}
              className="w-full h-9 px-3 bg-white border border-[#d1ded6] text-xs rounded-xl text-[#16382b] focus:outline-none focus:border-[#1b4332] cursor-pointer"
            >
              {provinces.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#55695e] mb-1">
              Region *
            </label>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                const foundReg = availableRegions.find((r) => r.name === e.target.value);
                const firstDist = foundReg?.districts[0]?.name || "";
                setDistrict(firstDist);
              }}
              className="w-full h-9 px-3 bg-white border border-[#d1ded6] text-xs rounded-xl text-[#16382b] focus:outline-none focus:border-[#1b4332] cursor-pointer"
            >
              {availableRegions.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* District & Sub-District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#55695e] mb-1">
              District *
            </label>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                const foundDist = availableDistricts.find((d) => d.name === e.target.value);
                const firstSub = foundDist?.sub_districts[0]?.name || "";
                setSubDistrict(firstSub);
              }}
              className="w-full h-9 px-3 bg-white border border-[#d1ded6] text-xs rounded-xl text-[#16382b] focus:outline-none focus:border-[#1b4332] cursor-pointer"
            >
              {availableDistricts.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#55695e] mb-1">
              Sub-District *
            </label>
            <select
              value={subDistrict}
              onChange={(e) => {
                setSubDistrict(e.target.value);
                const foundSub = availableSubDistricts.find((s) => s.name === e.target.value);
                const firstSite = foundSub?.sites[0]?.name || "";
                setSite(firstSite);
              }}
              className="w-full h-9 px-3 bg-white border border-[#d1ded6] text-xs rounded-xl text-[#16382b] focus:outline-none focus:border-[#1b4332] cursor-pointer"
            >
              {availableSubDistricts.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Site */}
        <div>
          <label className="block text-[11px] font-semibold text-[#55695e] mb-1">
            Site *
          </label>
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full h-9 px-3 bg-white border border-[#d1ded6] text-xs rounded-xl text-[#16382b] focus:outline-none focus:border-[#1b4332] cursor-pointer"
          >
            {availableSites.map((st) => (
              <option key={st.id} value={st.name}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#eef3ef] flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            icon={<Check className="w-4 h-4" />}
          >
            Save Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
