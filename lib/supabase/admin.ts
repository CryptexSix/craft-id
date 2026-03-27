import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;

  const env = getSupabaseEnv();
  if (!env.serviceRoleKey) {
    throw new Error(
      "[CraftID] Missing SUPABASE_SERVICE_ROLE_KEY. " +
        "This app writes to the DB from Route Handlers using the service role key.",
    );
  }

  cachedAdminClient = createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cachedAdminClient;
}
