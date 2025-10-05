/**
 * Supabase Admin Client
 * Uses SERVICE ROLE KEY - SERVER-ONLY!
 * NEVER expose this client or service role key to the client
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { readFileSync } from 'fs';
import { join } from 'path';

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get service role key from .env.server file (server-only)
 */
function getServiceRoleKey(): string {
  // First check environment variable
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // Try to read from .env.server (for seed script)
  try {
    const envServerPath = join(process.cwd(), '.env.server');
    const envContent = readFileSync(envServerPath, 'utf-8');
    const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    
    if (match?.[1]) {
      return match[1].trim();
    }
  } catch {
    // File doesn't exist or can't be read
  }

  throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment or .env.server');
}

/**
 * Create admin client with service role privileges
 * SERVER-ONLY - Never call from client-side code
 */
export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin configuration');
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

