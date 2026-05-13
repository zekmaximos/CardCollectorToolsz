import { redirect } from "next/navigation";
import { CreditCard, PiggyBank, Scale, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { money } from "@/lib/format";
import type { DashboardStats, Expense, UserCard } from "@/types";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
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

  const stats: DashboardStats = {
    total_cards: userCards.reduce((sum, card) => sum + Number(card.quantity ?? 0), 0),
    total_paid_cards: userCards.reduce((sum, card) => sum + Number(card.paid_price ?? 0) * Number(card.quantity ?? 0), 0),
    total_user_value: userCards.reduce((sum, card) => sum + Number(card.user_value ?? 0) * Number(card.quantity ?? 0), 0),
    total_expenses: userExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0),
    balance: 0,
  };
  stats.balance = stats.total_user_value - stats.total_expenses;

  return (
    <AppLayout title="Dashboard" subtitle="Resumo financeiro da sua colecao Pokemon.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Cartas" value={String(stats.total_cards)} hint="Soma das quantidades" icon={Sparkles} />
        <StatCard label="Investido em cartas" value={money(stats.total_paid_cards)} icon={CreditCard} />
        <StatCard label="Valor declarado" value={money(stats.total_user_value)} icon={PiggyBank} />
        <StatCard label="Gastos gerais" value={money(stats.total_expenses)} icon={CreditCard} />
        <StatCard label="Diferenca" value={money(stats.balance)} hint="Valor declarado - gastos" icon={Scale} />
      </div>

      {userCards.length === 0 && userExpenses.length === 0 ? (
        <EmptyState
          title="Comece criando seu primeiro album"
          description="Depois disso, pesquise cartas, salve os valores pagos e registre gastos avulsos para montar o painel financeiro."
          href="/albums"
          action="Criar album"
        />
      ) : null}
    </AppLayout>
  );
}
