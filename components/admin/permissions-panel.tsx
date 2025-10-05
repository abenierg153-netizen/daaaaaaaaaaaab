'use client'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { updateStaffPermissions } from '@/app/admin/actions/update-permissions'
import { toast } from 'sonner'
import type { StaffPermissionKey, StaffPermissions } from '@/lib/types/admin'

interface PermissionsPanelProps {
  userId: string;
  permissions: StaffPermissions;
  isAdmin?: boolean;
}

export function PermissionsPanel({ userId, permissions, isAdmin = false }: PermissionsPanelProps) {
  async function handleToggle(field: StaffPermissionKey, value: boolean) {
    const result = await updateStaffPermissions(userId, {
      ...permissions,
      [field]: value
    })
    
    if (result.success) {
      toast.success('Permissions updated')
    } else {
      toast.error('Failed to update permissions')
    }
  }
  
  const permissionLabels: Record<StaffPermissionKey, string> = {
    can_view_appointments: 'View Appointments',
    can_edit_appointments: 'Edit Appointments',
    can_view_patients: 'View Patients',
    can_edit_patients: 'Edit Patients',
    can_view_calendar: 'View Calendar',
    can_view_reports: 'View Reports',
    can_view_billing: 'View Billing',
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Permissions</h3>
      {Object.entries(permissionLabels).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between">
          <Label>{label}</Label>
          <Switch 
            checked={permissions[key as StaffPermissionKey]}
            onCheckedChange={(v) => handleToggle(key as StaffPermissionKey, v)}
            disabled={isAdmin && key === 'can_view_appointments'} // Prevent admin from downgrading self
          />
        </div>
      ))}
    </div>
  )
}

