'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { revalidatePath } from 'next/cache'
import type { StaffPermissionKey, StaffPermissions } from '@/lib/types/admin'

export async function updateStaffPermissions(userId: string, permissions: StaffPermissions) {
  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase.from('staff_permissions')
      .update(permissions)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/admin/staff')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

