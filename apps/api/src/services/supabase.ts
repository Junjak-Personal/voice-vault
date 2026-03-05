import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';

let _supabase: SupabaseClient<Database> | null = null;

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return { url, key };
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    if (!_supabase) {
      const { url, key } = getConfig();
      _supabase = createClient<Database>(url, key);
    }
    return Reflect.get(_supabase, prop, receiver);
  },
});

export function createClientForUser(accessToken: string) {
  const { url, key } = getConfig();
  return createClient<Database>(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
