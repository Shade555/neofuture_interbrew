import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  throw new Error(
    "Missing or invalid NEXT_PUBLIC_SUPABASE_URL in .env file.\n" +
      "Please add your Supabase project URL (e.g., https://xxxx.supabase.co)\n" +
      "Get it from: https://app.supabase.com → Settings → API",
  );
}

if (!supabaseAnonKey || supabaseAnonKey.startsWith("sb_")) {
  throw new Error(
    "Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.\n" +
      "Please add your Supabase anon public key (a long JWT token)\n" +
      "Get it from: https://app.supabase.com → Settings → API",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
