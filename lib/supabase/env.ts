type SupabaseEnv = {
  url: string;
  anonKey?: string;
  serviceRoleKey?: string;
};

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[CraftID] Missing required env var: ${name}. ` +
        `Add it to .env (local dev) and your deployment environment.`,
    );
  }
  return value;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", url),
    anonKey,
    serviceRoleKey,
  };
}
