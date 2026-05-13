import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { CardSearchResult } from "@/components/CardSearchResult";
import type { Album } from "@/types";
import { createClient } from "@/utils/supabase/server";

export default async function SearchCardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("albums")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppLayout title="Buscar cartas" subtitle="Pesquise na Pokemon TCG API sem expor a chave no navegador.">
      <CardSearchResult albums={(data ?? []) as Album[]} />
    </AppLayout>
  );
}
