import { startEmailReminder } from './cron';

let initialized = false;

export function initializeServices() {
  if (initialized) return;
  initialized = true;

  // Initialize email reminders
  startEmailReminder();
}
