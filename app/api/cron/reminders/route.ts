/**
 * Reminder Cron Job
 * Runs hourly to send appointment reminders with exponential backoff retry
 * Schedule: 0 * * * * (every hour)
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { Resend } from 'resend';
import { formatAppointmentTime } from '@/lib/utils/timezone';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional but recommended for Vercel cron)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();

    // Find reminders to send:
    // 1. Pending reminders where it's time to send
    // 2. Failed reminders ready for retry (retry_count < 3 and next_retry_at <= now)
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select(`
        *,
        appointments:appointment_id (
          id,
          starts_at,
          ends_at,
          status,
          deleted_at,
          patients:patient_id (
            email,
            user_id
          ),
          dentists:dentist_id (
            full_name
          ),
          services:service_id (
            name
          )
        )
      `)
      .or(`status.eq.pending,and(status.eq.failed,retry_count.lt.3,next_retry_at.lte.${now.toISOString()})`)
      .not('appointments.status', 'eq', 'cancelled')
      .is('appointments.deleted_at', null);

    if (remindersError) {
      logger.error('Failed to fetch reminders', remindersError);
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }

    logger.info(`Processing ${reminders?.length || 0} reminders`);

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const reminder of reminders || []) {
      try {
        const appointment = reminder.appointments as any;
        
        if (!appointment || !appointment.patients?.email) {
          logger.warn('Skipping reminder - missing appointment or email', { reminderId: reminder.id });
          results.skipped++;
          continue;
        }

        // Check if it's time to send this reminder
        const appointmentTime = new Date(appointment.starts_at);
        const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        let shouldSend = false;
        if (reminder.type === '24h' && hoursUntil <= 24 && hoursUntil > 2) {
          shouldSend = true;
        } else if (reminder.type === '2h' && hoursUntil <= 2 && hoursUntil > 0) {
          shouldSend = true;
        } else if (reminder.status === 'failed') {
          // Retry failed reminders
          shouldSend = true;
        }

        if (!shouldSend) {
          results.skipped++;
          continue;
        }

        // Send email
        const timeFormatted = formatAppointmentTime(appointment.starts_at, appointment.ends_at);
        const { error: emailError } = await resend.emails.send({
          from: 'SmileFlow <noreply@smileflow.dental>',
          to: appointment.patients.email,
          subject: `Reminder: Upcoming Appointment ${reminder.type === '24h' ? 'Tomorrow' : 'in 2 Hours'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Appointment Reminder</h2>
              <p>This is a reminder for your upcoming dental appointment:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Service:</strong> ${appointment.services?.name}</p>
                <p><strong>Dentist:</strong> Dr. ${appointment.dentists?.full_name}</p>
                <p><strong>Time:</strong> ${timeFormatted}</p>
              </div>
              <p>Please arrive 10 minutes early. If you need to cancel or reschedule, please contact us as soon as possible.</p>
              <p>Thank you,<br>SmileFlow Team</p>
            </div>
          `,
        });

        if (emailError) {
          throw emailError;
        }

        // Mark as sent
        await supabase
          .from('reminders')
          .update({
            status: 'sent',
            sent_at: now.toISOString(),
          })
          .eq('id', reminder.id);

        logger.info('Reminder sent successfully', {
          reminderId: reminder.id,
          appointmentId: appointment.id,
          type: reminder.type,
        });

        results.sent++;
      } catch (error) {
        // Mark as failed and schedule retry
        const retryCount = reminder.retry_count + 1;
        const delays = [15, 60, 360, 1440]; // minutes: 15min, 1hr, 6hr, 24hr
        const delayMinutes = delays[retryCount] || 1440;
        const nextRetryAt = new Date(now.getTime() + delayMinutes * 60 * 1000);

        await supabase
          .from('reminders')
          .update({
            status: 'failed',
            retry_count: retryCount,
            last_error: error instanceof Error ? error.message : 'Unknown error',
            next_retry_at: nextRetryAt.toISOString(),
          })
          .eq('id', reminder.id);

        logger.error('Failed to send reminder', error as Error, {
          reminderId: reminder.id,
          retryCount,
          nextRetryAt: nextRetryAt.toISOString(),
        });

        results.failed++;
      }
    }

    logger.info('Reminder cron completed', results);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error('Reminder cron failed', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

