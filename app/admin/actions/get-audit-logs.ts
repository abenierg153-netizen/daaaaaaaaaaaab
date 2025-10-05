'use server'
import { createServerClient } from '@/lib/supabase/server'
import type { AuditLog } from '@/lib/types/admin'

export async function getAuditLogs(limit: number = 10): Promise<AuditLog[]> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        entity,
        entity_id,
        details,
        created_at,
        user_profiles!audit_logs_user_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Get audit logs error:', error)
    return []
  }
}