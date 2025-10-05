/**
 * Data Purge Cron Job
 * Runs monthly to enforce data retention policies
 * Schedule: 0 0 1 * * (1st of each month at midnight)
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional but recommended for Vercel cron)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createAdminClient();

    logger.info('Starting data purge cron job');

    // Call the database function to purge old records
    const { error: purgeError } = await supabase.rpc('hard_purge_old_records');

    if (purgeError) {
      logger.error('Data purge failed', purgeError);
      return NextResponse.json({ error: 'Purge failed' }, { status: 500 });
    }

    // Get counts for logging
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    logger.audit('Data purge completed', 'system', {
      auditLogsRetention: '2 years',
      remindersRetention: '6 months',
      appointmentsRetention: '5 years',
      executedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Data purge completed successfully',
      policies: {
        auditLogs: 'Deleted records older than 2 years',
        reminders: 'Deleted sent reminders older than 6 months',
        appointments: 'Soft-deleted appointments older than 5 years',
      },
    });
  } catch (error) {
    logger.error('Data purge cron failed', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

