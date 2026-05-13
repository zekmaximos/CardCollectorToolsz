import Link from "next/link";
import { redirect } from "next/navigation";
import { AlbumForm } from "@/components/AlbumForm";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import type { Album } from "@/types";
import { createClient } from "@/utils/supabase/server";

export default async function AlbumsPage() {
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

  const albums = (data ?? []) as Album[];

  return (
    <AppLayout title="Albuns" subtitle="Organize suas cartas por colecao, deck, objetivo ou investimento.">
      <AlbumForm />
      {albums.length === 0 ? (
        <EmptyState title="Nenhum album criado" description="Crie um album para comecar a adicionar cartas pesquisadas na API." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link key={album.id} href={`/albums/${album.id}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300">
              <h2 className="text-lg font-semibold text-slate-950">{album.name}</h2>
              <p className="mt-2 min-h-10 text-sm text-slate-600">{album.description ?? "Sem descricao"}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-emerald-700">Abrir album</span>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
