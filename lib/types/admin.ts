export type StaffPermissionKey =
  | 'can_view_appointments'
  | 'can_edit_appointments'
  | 'can_view_patients'
  | 'can_edit_patients'
  | 'can_view_calendar'
  | 'can_view_reports'
  | 'can_view_billing';

export type StaffPermissions = Record<StaffPermissionKey, boolean>;

export interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'staff' | 'admin';
  active: boolean;
  permissions: StaffPermissions;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  entity: string;
  entity_id: string;
  details: any;
  created_at: string;
  user_profiles?: {
    full_name: string;
    email: string;
  };
}

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';