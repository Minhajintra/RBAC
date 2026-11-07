/**
 * Permission Matrix and Me Permissions Contracts
 * Follows IntraShip UAM API specifications
 */

export interface CrudPermissions {
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface FeaturePermissions {
  is_visible: boolean;
  is_enabled: boolean;
}

export interface ModulePermission {
  module: string;
  crud: CrudPermissions;
  features: FeaturePermissions;
}

export interface MePermissionsResponse {
  user_id: string | number;
  role: string;
  permissions: Record<
    string,
    {
      crud: CrudPermissions;
      features: FeaturePermissions;
    }
  >;
}

