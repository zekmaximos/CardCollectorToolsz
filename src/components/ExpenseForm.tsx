"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createExpense } from "@/app/actions";
import { todayIso } from "@/lib/format";

export function ExpenseForm() {
  const [category, setCategory] = useState("booster");
  const isBooster = category === "booster";

  return (
    <form action={createExpense} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
      <input name="expense_date" type="date" defaultValue={todayIso()} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <select
        name="category"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="booster">Booster</option>
        <option value="box">Box</option>
        <option value="carta_avulsa">Carta avulsa</option>
        <option value="acessorio">Acessorio</option>
        <option value="outro">Outro</option>
      </select>
      <input name="item_name" required placeholder="Item" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input name="quantity" required min="1" step="1" type="number" defaultValue="1" placeholder="Qtd" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input name="unit_amount" required min="0" step="0.01" type="number" placeholder="Valor unitario" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        <Plus className="size-4" />
        Salvar
      </button>
      {isBooster ? (
        <>
          <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input name="has_hit" type="checkbox" value="true" className="size-4 rounded border-slate-300" />
            Veio hit
          </label>
          <select name="hit_type" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tipo de hit</option>
            <option value="ex">ex</option>
            <option value="full_art">Full art</option>
            <option value="illustration_rare">Illustration rare</option>
            <option value="special_illustration_rare">Special illustration rare</option>
            <option value="secret_rare">Secret rare</option>
            <option value="ultra_rare">Ultra rare</option>
            <option value="outro">Outro</option>
          </select>
          <input name="hit_notes" placeholder="Carta(s) hit / detalhes" className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-4" />
        </>
      ) : null}
      <textarea name="notes" placeholder="Observacoes" className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-6" />
    </form>
  );
}
