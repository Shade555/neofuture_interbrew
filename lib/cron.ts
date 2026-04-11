import * as cron from 'node-cron';

export function startEmailReminder() {
  // Run every day at 8:00 AM UTC
  cron.schedule('0 8 * * *', async () => {
    console.log('Running scheduled email reminder job...');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/send-interview-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      console.log('Email reminder job completed:', result);
    } catch (error) {
      console.error('Email reminder job failed:', error);
    }
  });

  console.log('Email reminder cron job initialized (runs daily at 8:00 AM UTC)');
}
