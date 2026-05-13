"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createAlbumWithState, type ActionState } from "@/app/actions";

const initialState: ActionState = { ok: false, message: "" };

export function AlbumForm() {
  const [state, formAction, pending] = useActionState(createAlbumWithState, initialState);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_2fr_auto]">
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
        <button
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Plus className="size-4" />
          {pending ? "Criando..." : "Criar"}
        </button>
      </form>
      {state.message ? (
        <p className={`rounded-md px-4 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
