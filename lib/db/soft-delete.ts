/**
 * Soft Delete Utilities
 * Implements soft delete pattern for legal compliance and data retention
 */

import { createServerClient } from '@/lib/supabase/server';

type TableName = 'user_profiles' | 'patients' | 'dentists' | 'services' | 'appointments';

/**
 * Soft delete a record by setting deleted_at timestamp
 * Requires staff/admin privileges
 */
export async function softDelete(
  table: TableName,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Restore a soft-deleted record by clearing deleted_at
 * Requires staff/admin privileges
 */
export async function restore(
  table: TableName,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Permanently delete a record from database
 * ADMIN ONLY - Use with extreme caution
 * Prefer soft delete for compliance
 */
export async function permanentDelete(
  table: TableName,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Admin privileges required' };
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a record is soft-deleted
 */
export async function isDeleted(
  table: TableName,
  id: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { data } = await supabase
      .from(table)
      .select('deleted_at')
      .eq('id', id)
      .single();

    return !!data?.deleted_at;
  } catch {
    return false;
  }
}

