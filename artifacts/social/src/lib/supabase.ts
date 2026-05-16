import { createClient } from "@supabase/supabase-js";

// The env vars in this environment are stored with their names swapped.
// VITE_SUPABASE_URL = "VITE_SUPABASE_ANON_KEY=sb_publishable_..."
// VITE_SUPABASE_ANON_KEY = "VITE_SUPABASE_URL=https://..."
// Extract the real value from "NAME=value" format if needed.
function extract(raw: string): string {
  if (!raw) return raw;
  const eqIdx = raw.indexOf("=");
  if (eqIdx > 0) {
    const maybeName = raw.slice(0, eqIdx);
    // If the part before "=" looks like an env var name (no spaces, all caps/underscores)
    if (/^[A-Z_]+$/.test(maybeName)) {
      return raw.slice(eqIdx + 1);
    }
  }
  return raw;
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!rawUrl || !rawKey) {
  throw new Error("Missing Supabase environment variables.");
}

const val1 = extract(rawUrl);
const val2 = extract(rawKey);

// After extraction, figure out which is URL and which is the anon key
const supabaseUrl = val1.startsWith("https://") ? val1 : val2;
const supabaseAnonKey = val1.startsWith("https://") ? val2 : val1;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
