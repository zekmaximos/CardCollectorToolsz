import { NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/utils/supabase/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    supabaseUrlConfigured: Boolean(getSupabaseUrl()),
    supabaseKeyConfigured: Boolean(getSupabasePublishableKey()),
    pokemonApiKeyConfigured: Boolean(process.env.POKEMON_TCG_API_KEY),
  });
}
