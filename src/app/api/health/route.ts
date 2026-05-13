import { NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/utils/supabase/env";

export function GET() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  return NextResponse.json({
    ok: true,
    supabaseUrlAvailable: Boolean(supabaseUrl),
    supabaseKeyAvailable: Boolean(supabaseKey),
    supabaseUrlFromEnv: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseKeyFromEnv: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    pokemonApiKeyConfigured: Boolean(process.env.POKEMON_TCG_API_KEY),
  });
}
