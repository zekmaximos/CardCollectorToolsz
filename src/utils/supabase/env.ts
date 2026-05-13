const DEFAULT_SUPABASE_URL = "https://woekkhvdoaortvslebdk.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_UU2vLwp3hma_XMnEb1dkqg_FWb5ISuS";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    DEFAULT_SUPABASE_PUBLISHABLE_KEY
  );
}

export function getSupabaseConfig() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (!url || !key) {
    throw new Error("Supabase URL and publishable key are required.");
  }

  return { url, key };
}
