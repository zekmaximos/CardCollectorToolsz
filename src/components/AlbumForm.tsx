import { Plus } from "lucide-react";
import { createAlbum } from "@/app/actions";

export function AlbumForm() {
  return (
    <form action={createAlbum} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_2fr_auto]">
      <input
        name="name"
        required
        placeholder="Nome do album"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
      />
      <input
        name="description"
        placeholder="Descricao opcional"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
      />
      <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        <Plus className="size-4" />
        Criar
      </button>
    </form>
  );
}
