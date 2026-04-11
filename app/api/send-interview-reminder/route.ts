import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get today's date in multiple formats to handle timezone issues
    const today = new Date();
    const todayUTC = today.toISOString().split('T')[0]; // YYYY-MM-DD UTC
    
    // Also check yesterday and tomorrow in case of timezone differences
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log('📧 [Email Reminder] Starting email job...');
    console.log('📅 Checking dates: yesterday=%s, today=%s, tomorrow=%s', yesterdayStr, todayUTC, tomorrowStr);

    // Fetch interviews from yesterday, today, and tomorrow to handle timezone differences
    const { data: interviews, error } = await supabase
      .from('user_interviews')
      .select('id, user_id, subject, difficulty, round, notes, user_email, interview_date')
      .in('interview_date', [yesterdayStr, todayUTC, tomorrowStr])
      .eq('email_sent', false);
    
    console.log('🔍 Query error:', error);
    console.log('📋 Interviews found:', interviews?.length || 0);
    if (interviews && interviews.length > 0) {
      console.log('📋 Interview dates:', interviews.map(iv => iv.interview_date));
    }

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch interviews' },
        { status: 500 }
      );
    }

    if (!interviews || interviews.length === 0) {
      return NextResponse.json({ 
        message: 'No interviews to remind today',
        count: 0 
      });
    }

    // Send email for each interview
    const emailResults = await Promise.all(
      interviews.map(async (interview) => {
        try {
          console.log(`📤 Sending email to: ${interview.user_email} for subject: ${interview.subject}`);
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <div style="background-color: white; padding: 30px; border-radius: 8px;">
                <h2 style="color: #2d3748; margin-top: 0;">🎯 Interview Reminder</h2>
                <p style="color: #4a5568; font-size: 16px;">Hello,</p>
                <p style="color: #4a5568; font-size: 16px;">You have a scheduled interview <strong>today</strong>!</p>
                
                <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #48bb78;">
                  <p style="margin: 8px 0; color: #2d3748;"><strong>Subject:</strong> ${interview.subject || 'N/A'}</p>
                  <p style="margin: 8px 0; color: #2d3748;"><strong>Difficulty:</strong> ${interview.difficulty || 'N/A'}</p>
                  <p style="margin: 8px 0; color: #2d3748;"><strong>Round:</strong> ${interview.round || 'N/A'}</p>
                  ${interview.notes ? `<p style="margin: 8px 0; color: #2d3748;"><strong>Notes:</strong> ${interview.notes}</p>` : ''}
                </div>
                
                <p style="color: #4a5568; font-size: 16px;">Make sure you're prepared! Good luck! 💪</p>
                <p style="color: #718096; font-size: 14px; margin-bottom: 0;">Best regards,<br/>InterBrew Team</p>
              </div>
            </div>
          `;

          const response = await resend.emails.send({
            from: 'onboarding@resend.dev', // Using default Resend domain for testing
            to: 'slevincordeiro@student.sfit.ac.in', // Your verified email for testing
            subject: `Interview Reminder: ${interview.subject}`,
            html: emailHtml,
          });

          console.log(`✅ Email sent successfully. Response:`, JSON.stringify(response, null, 2));
          return { interviewId: interview.id, success: true, response };
        } catch (emailError) {
          console.error(`❌ Failed to send email for interview ${interview.id}:`, emailError);
          return { interviewId: interview.id, success: false, error: String(emailError) };
        }
      })
    );

    // Update database to mark emails as sent
    const successfulIds = emailResults
      .filter(r => r.success)
      .map(r => r.interviewId);

    if (successfulIds.length > 0) {
      await supabase
        .from('user_interviews')
        .update({ 
          email_sent: true, 
          email_sent_at: new Date().toISOString() 
        })
        .in('id', successfulIds);
    }

    return NextResponse.json({
      message: `Sent ${successfulIds.length} email reminder(s)`,
      count: successfulIds.length,
      results: emailResults,
    });
  } catch (error) {
    console.error('Error in send-interview-reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
