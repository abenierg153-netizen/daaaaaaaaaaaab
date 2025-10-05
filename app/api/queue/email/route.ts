import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, fullName } = await request.json();
    
    const result = await resend.emails.send({
      from: 'SmileFlow Admin <noreply@smileflow.com>',
      to,
      subject: 'Welcome to SmileFlow - Your Staff Account is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to SmileFlow!</h2>
          <p>Hi ${fullName},</p>
          <p>Your staff account has been created successfully. You can now access the SmileFlow admin dashboard.</p>
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Visit: ${process.env.NEXT_PUBLIC_APP_URL}/login</li>
            <li>Use your email: ${to}</li>
            <li>Click "Forgot Password" to set your password</li>
          </ol>
          <p>If you have any questions, please contact your administrator.</p>
          <p>Best regards,<br>SmileFlow Team</p>
        </div>
      `
    });
    
    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error: any) {
    console.error('Email queue error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}