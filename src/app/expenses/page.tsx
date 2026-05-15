import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { ExpenseForm } from "@/components/ExpenseForm";
import { StatCard } from "@/components/StatCard";
import { money, todayIso } from "@/lib/format";
import type { Expense } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { CalendarDays, Receipt, WalletCards } from "lucide-react";

function startOfCurrentWeek() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data }, { data: pullRates }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("expense_date", { ascending: false }),
    supabase
      .from("pokemon_tcg_pull_rates")
      .select("set_name")
      .eq("is_active", true)
      .order("set_name", { ascending: true }),
  ]);

  const expenses = (data ?? []) as Expense[];
  const boosterCollections = [...new Set((pullRates ?? []).map((rate) => String(rate.set_name)).filter(Boolean))];
  const today = todayIso();
  const weekStart = startOfCurrentWeek();
  const monthPrefix = today.slice(0, 7);

  const totalToday = expenses.filter((expense) => expense.expense_date === today).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalWeek = expenses.filter((expense) => expense.expense_date >= weekStart).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalMonth = expenses.filter((expense) => expense.expense_date.startsWith(monthPrefix)).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <AppLayout title="Gastos" subtitle="Registre boosters, boxes, cartas avulsas, acessorios e outros custos.">
      <ExpenseForm boosterCollections={boosterCollections} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hoje" value={money(totalToday)} icon={CalendarDays} />
        <StatCard label="Semana atual" value={money(totalWeek)} icon={CalendarDays} />
        <StatCard label="Mes atual" value={money(totalMonth)} icon={Receipt} />
        <StatCard label="Total geral" value={money(total)} icon={WalletCards} />
      </div>

      {expenses.length === 0 ? (
        <EmptyState title="Nenhum gasto registrado" description="Quando voce cadastrar compras e acessorios, os totais aparecem aqui." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qtd</th>
                <th className="px-4 py-3">Unitario</th>
                <th className="px-4 py-3">Hit</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const quantity = Number(expense.quantity ?? 1);
                const unitAmount = Number(expense.unit_amount ?? expense.amount);
                const hitLabel = expense.category === "booster"
                  ? expense.has_hit
                    ? expense.hit_type ?? "Hit"
                    : "Sem hit"
                  : "-";

                return (
                  <tr key={expense.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">{expense.expense_date}</td>
                    <td className="px-4 py-3">{expense.category}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-950">{expense.item_name}</div>
                      {expense.hit_notes ? <div className="mt-1 text-xs text-slate-500">{expense.hit_notes}</div> : null}
                    </td>
                    <td className="px-4 py-3">{quantity}</td>
                    <td className="px-4 py-3">{money(unitAmount)}</td>
                    <td className="px-4 py-3">{hitLabel}</td>
                    <td className="px-4 py-3 font-semibold">{money(expense.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
