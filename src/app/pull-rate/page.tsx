import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { AutoInsightsPanel } from "@/components/pull-rate/AutoInsightsPanel";
import { CollectionPerformanceTable } from "@/components/pull-rate/CollectionPerformanceTable";
import { ProbabilityTable } from "@/components/pull-rate/ProbabilityTable";
import { PullRateCharts } from "@/components/pull-rate/PullRateCharts";
import { PullRateOverviewCards } from "@/components/pull-rate/PullRateOverviewCards";
import { PullRateSimulator } from "@/components/pull-rate/PullRateSimulator";
import { RealVsExpectedTable } from "@/components/pull-rate/RealVsExpectedTable";
import { RoutineEstimator } from "@/components/pull-rate/RoutineEstimator";
import { StreaksPanel } from "@/components/pull-rate/StreaksPanel";
import { EmptyState } from "@/components/EmptyState";
import { buildPullRateStats } from "@/lib/pull-rate/data";
import type { Expense, PullRate, UserCard } from "@/types";
import { createClient } from "@/utils/supabase/server";

export default async function PullRatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: expenses, error: expensesError }, { data: pullRates, error: pullRatesError }, { data: cards, error: cardsError }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("category", "booster")
      .order("expense_date", { ascending: true }),
    supabase
      .from("pokemon_tcg_pull_rates")
      .select("*")
      .eq("is_active", true)
      .order("set_name", { ascending: true }),
    supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", user.id),
  ]);

  if (expensesError || pullRatesError || cardsError) {
    return (
      <AppLayout title="Calculadora de Pull Rate" subtitle="Probabilidade, custo por hit e comparacao com seu resultado real.">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Nao foi possivel carregar a calculadora. Confira se a migration de pull rates foi aplicada no Supabase.
        </div>
      </AppLayout>
    );
  }

  const stats = buildPullRateStats((expenses ?? []) as Expense[], (pullRates ?? []) as PullRate[], (cards ?? []) as UserCard[]);

  return (
    <AppLayout title="Calculadora de Pull Rate" subtitle="Analise matematica dos boosters ja cadastrados, sem duplicar seu registro de compras.">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Pull rates estimados com base em dados publicos/comunitarios. Resultados reais podem variar, especialmente em boosters brasileiros de 6 cartas.
      </div>

      {stats.pullRates.length === 0 ? (
        <EmptyState title="Sem pull rates cadastrados" description="Rode a migration/seed de pokemon_tcg_pull_rates para habilitar os calculos teoricos." />
      ) : (
        <>
          {stats.totalBoosters === 0 ? (
            <EmptyState
              title="Sem boosters para analisar"
              description="Cadastre boosters em Gastos usando o fluxo existente. A calculadora vai usar esses dados automaticamente."
              href="/expenses"
              action="Registrar boosters"
            />
          ) : null}

          <PullRateOverviewCards stats={stats} />
          <div className="grid gap-4 xl:grid-cols-2">
            <PullRateSimulator pullRates={stats.pullRates} averageBoosterCost={stats.averageBoosterCost} />
            <RoutineEstimator pullRates={stats.pullRates} />
          </div>
          <ProbabilityTable pullRates={stats.pullRates} />
          <div className="grid gap-4 xl:grid-cols-2">
            <StreaksPanel stats={stats} />
            <AutoInsightsPanel stats={stats} />
          </div>
          <RealVsExpectedTable stats={stats} />
          <CollectionPerformanceTable stats={stats} />
          {stats.totalBoosters > 0 ? <PullRateCharts stats={stats} /> : null}
        </>
      )}
    </AppLayout>
  );
}
