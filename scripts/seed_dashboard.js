// Seed a sample dashboard row for a user
// Usage: set SEED_USER_ID and run: node scripts/seed_dashboard.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Use the service role key for seeding (bypasses RLS). Set SUPABASE_SERVICE_ROLE_KEY in your .env.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function seed() {
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.error('Please set SEED_USER_ID environment variable to the target user id.');
    process.exit(1);
  }

  const payload = {
    user_id: userId,
    // per-skill readiness stored as JSON keyed by skill abbreviations
    readiness_score: {
      CO: 72,
      CT: 30,
      CM: 55,
      QA: 20,
      PS: 90,
      SD: 45,
      DA: 60,
      AL: 12,
      ML: 78,
      CL: 34,
      MB: 56,
      UX: 18
    },
    streak: 5,
    favourite_questions: [
      'What is closure in JavaScript?',
      'Design an LRU cache.'
    ],
    this_week: {
      xp: 1250,
      badges: 2,
      leaderboard_rank: 42,
      modules_completed: 3
    },
    graph_data: {
      monthly: [10, 30, 50, 70, 90, 120],
      weekly: [5,10,15,20,25,30,35],
      // per-subject arrays whose last value is the readiness percent for that subject
      subject: {
        "Frontend": [72],
        "Backend": [30],
        "Database": [55],
        "DevOps": [20],
        "Security": [90],
        "Data Science": [45],
        "System Programming": [60],
        "Algorithms": [12],
        "Machine Learning": [78],
        "Cloud": [34],
        "Mobile": [56],
        "UX/UI": [18]
      }
    }
  };

  const { data, error } = await supabase.from('user_dashboards').upsert(payload, { onConflict: ['user_id'] }).select();
  if (error) {
    console.error('Seed error:', error);
    process.exitCode = 1;
    return;
  }
  console.log('Seeded dashboard for user', userId);
  return;
}

seed().catch((err) => { console.error(err); process.exitCode = 1; });
