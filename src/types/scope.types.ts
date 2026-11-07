/**
 * User Scope Assignment Types
 * Contract: PUT /api/v1/users/{id}/scope
 */

export interface UserScopeAssignmentRequest {
  user_id: string | number;
  role: string;
  workspace_id: string;
  province: string;
  region: string;
  district: string;
  sub_district: string;
  site: string;
}

export interface UserScopeAssignmentResponse {
  status: string;
  message: string;
  data: UserScopeAssignmentRequest;
  request_id?: string;
}

export interface ScopeSite {
  id: string;
  name: string;
}

export interface ScopeSubDistrict {
  id: string;
  name: string;
  sites: ScopeSite[];
}

export interface ScopeDistrict {
  id: string;
  name: string;
  sub_districts: ScopeSubDistrict[];
}

export interface ScopeRegion {
  id: string;
  name: string;
  districts: ScopeDistrict[];
}

export interface ScopeProvince {
  id: string;
  name: string;
  regions: ScopeRegion[];
}

export interface ScopeWorkspace {
  id: string;
  name: string;
}

