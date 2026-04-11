// Run this script locally to seed the collections table
// Usage: npm run seed:collections

// Load environment variables from .env automatically
import 'dotenv/config';

import { supabase } from '../lib/supabaseClient.js';

async function seed() {
  const collections = [
    { title: 'Frontend', section: 'Domains', description: 'Frontend Description', order: 1 },
    { title: 'Backend', section: 'Domains', description: 'Backend Description', order: 2 },
    { title: 'Data Science', section: 'Domains', description: 'Data Science Description', order: 3 },
    { title: 'MongoDB', section: 'Database', description: 'MongoDB Description', order: 1 },
    { title: 'SQL', section: 'Database', description: 'SQL Description', order: 2 },
    { title: 'Data Structure', section: 'DSA', description: 'Data Structure Description', order: 1 },
    { title: 'Analysis Of Algorithm', section: 'DSA', description: 'Analysis Of Algorithm Description', order: 2 },
    { title: 'Time Complexity', section: 'DSA', description: 'Time Complexity Description', order: 3 },
    { title: 'Operating System', section: 'Extras', description: 'Operating System Description', order: 1 },
    { title: 'Computer Network', section: 'Extras', description: 'Computer Network Description', order: 2 },
  ];

  for (const c of collections) {
    const slug = c.title.toLowerCase().replace(/\s+/g, '-');
    const payload = { ...c, slug };
    const { data, error } = await supabase.from('collections').upsert(payload, { onConflict: ['slug'] }).select();
    if (error) {
      console.error('Insert error for', c.title, error);
      process.exitCode = 1;
    } else {
      console.log('Upserted', c.title);
    }
  }
  return;
}

seed().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
