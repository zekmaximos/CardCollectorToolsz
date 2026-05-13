import { notFound, redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { UserCardItem } from "@/components/UserCardItem";
import type { Album, UserCard } from "@/types";
import { createClient } from "@/utils/supabase/server";

export default async function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: album }, { data: cards }] = await Promise.all([
    supabase.from("albums").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("user_cards").select("*").eq("album_id", id).eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  if (!album) notFound();

  const typedAlbum = album as Album;
  const userCards = (cards ?? []) as UserCard[];

  return (
    <AppLayout title={typedAlbum.name} subtitle={typedAlbum.description ?? "Cartas cadastradas neste album."}>
      {userCards.length === 0 ? (
        <EmptyState title="Album vazio" description="Pesquise cartas e adicione a este album com valores, idioma, condicao e observacoes." href="/cards/search" action="Buscar cartas" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {userCards.map((card) => (
            <UserCardItem key={card.id} card={card} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
