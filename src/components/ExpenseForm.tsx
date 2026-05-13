import { Plus } from "lucide-react";
import { createExpense } from "@/app/actions";
import { todayIso } from "@/lib/format";

export function ExpenseForm() {
  return (
    <form action={createExpense} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
      <input name="expense_date" type="date" defaultValue={todayIso()} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <select name="category" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="booster">Booster</option>
        <option value="box">Box</option>
        <option value="carta_avulsa">Carta avulsa</option>
        <option value="acessorio">Acessorio</option>
        <option value="outro">Outro</option>
      </select>
      <input name="item_name" required placeholder="Item" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input name="amount" required min="0" step="0.01" type="number" placeholder="Valor" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        <Plus className="size-4" />
        Salvar
      </button>
      <textarea name="notes" placeholder="Observacoes" className="md:col-span-5 rounded-md border border-slate-300 px-3 py-2 text-sm" />
    </form>
  );
}
