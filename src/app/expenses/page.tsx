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

  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false });

  const expenses = (data ?? []) as Expense[];
  const today = todayIso();
  const weekStart = startOfCurrentWeek();
  const monthPrefix = today.slice(0, 7);

  const totalToday = expenses.filter((expense) => expense.expense_date === today).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalWeek = expenses.filter((expense) => expense.expense_date >= weekStart).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalMonth = expenses.filter((expense) => expense.expense_date.startsWith(monthPrefix)).reduce((sum, expense) => sum + Number(expense.amount), 0);
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <AppLayout title="Gastos" subtitle="Registre boosters, boxes, cartas avulsas, acessorios e outros custos.">
      <ExpenseForm />
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
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{expense.expense_date}</td>
                  <td className="px-4 py-3">{expense.category}</td>
                  <td className="px-4 py-3">{expense.item_name}</td>
                  <td className="px-4 py-3 font-semibold">{money(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
