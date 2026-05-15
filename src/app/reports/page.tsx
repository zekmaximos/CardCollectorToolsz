import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { money } from "@/lib/format";
import type { Expense, UserCard } from "@/types";
import { createClient } from "@/utils/supabase/server";

function addToMap(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: cards }, { data: expenses }] = await Promise.all([
    supabase.from("user_cards").select("*").eq("user_id", user.id),
    supabase.from("expenses").select("*").eq("user_id", user.id),
  ]);

  const userCards = (cards ?? []) as UserCard[];
  const userExpenses = (expenses ?? []) as Expense[];
  const byMonth = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const byRarity = new Map<string, number>();

  userExpenses.forEach((expense) => {
    addToMap(byMonth, expense.expense_date.slice(0, 7), Number(expense.amount));
    addToMap(byCategory, expense.category, Number(expense.amount));
  });

  userCards.forEach((card) => {
    addToMap(byRarity, card.rarity ?? "Sem raridade", Number(card.quantity ?? 0));
  });

  const topValuable = [...userCards]
    .sort((a, b) => Number(b.user_value ?? 0) * Number(b.quantity ?? 0) - Number(a.user_value ?? 0) * Number(a.quantity ?? 0))
    .slice(0, 10);
  const topExpenses = [...userExpenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 10);
  const boosterExpenses = userExpenses.filter((expense) => expense.category === "booster");
  const boosterQuantity = boosterExpenses.reduce((sum, expense) => sum + Number(expense.quantity ?? 1), 0);
  const boosterHits = boosterExpenses.filter((expense) => expense.has_hit).length;
  const boosterSpend = boosterExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <AppLayout title="Relatorios" subtitle="Leitura simples de gastos, raridades e itens de maior valor.">
      {userCards.length === 0 && userExpenses.length === 0 ? (
        <EmptyState title="Sem dados para relatorios" description="Cadastre cartas e gastos para visualizar os rankings e agrupamentos." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ReportCard title="Gasto por mes" rows={[...byMonth.entries()].map(([label, value]) => [label, money(value)])} />
          <ReportCard title="Gasto por categoria" rows={[...byCategory.entries()].map(([label, value]) => [label, money(value)])} />
          <ReportCard
            title="Boosters e hits"
            rows={[
              ["Boosters comprados", String(boosterQuantity)],
              ["Entradas com hit", String(boosterHits)],
              ["Gasto em boosters", money(boosterSpend)],
            ]}
          />
          <ReportCard title="Cartas por raridade" rows={[...byRarity.entries()].map(([label, value]) => [label, String(value)])} />
          <ReportCard
            title="Top 10 cartas mais valiosas"
            rows={topValuable.map((card) => [card.name, money(Number(card.user_value ?? 0) * Number(card.quantity ?? 0))])}
          />
          <ReportCard title="Top 10 maiores gastos" rows={topExpenses.map((expense) => [expense.item_name, money(expense.amount)])} />
        </div>
      )}
    </AppLayout>
  );
}

function ReportCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Sem registros.</p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={`${title}-${label}`} className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="text-slate-600">{label}</span>
              <span className="font-semibold text-slate-950">{value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
