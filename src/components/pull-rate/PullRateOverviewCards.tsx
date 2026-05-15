import { BadgeDollarSign, Boxes, Sparkles, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { money } from "@/lib/format";
import { probabilityToPercent } from "@/lib/pull-rate/math";
import type { PullRateStats } from "@/lib/pull-rate/data";

export function PullRateOverviewCards({ stats }: { stats: PullRateStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="Boosters abertos" value={String(stats.totalBoosters)} icon={Boxes} />
      <StatCard label="Total gasto" value={money(stats.totalSpent)} icon={BadgeDollarSign} />
      <StatCard label="Major hits" value={String(stats.totalMajorHits)} icon={Sparkles} />
      <StatCard label="Premium hits" value={String(stats.totalPremiumHits)} icon={Sparkles} />
      <StatCard label="Hit rate geral" value={probabilityToPercent(stats.hitRate)} icon={TrendingUp} />
      <StatCard label="Hit rate premium" value={probabilityToPercent(stats.premiumHitRate)} icon={TrendingUp} />
      <StatCard label="Custo medio/booster" value={money(stats.averageBoosterCost)} icon={BadgeDollarSign} />
      <StatCard label="Custo por major hit" value={stats.costPerMajorHit === null ? "-" : money(stats.costPerMajorHit)} icon={BadgeDollarSign} />
      <StatCard label="Custo por premium hit" value={stats.costPerPremiumHit === null ? "-" : money(stats.costPerPremiumHit)} icon={BadgeDollarSign} />
      <StatCard label="Resultado liquido estimado" value={money(stats.estimatedNetResult)} hint="Valor citado em hits - total gasto" icon={TrendingUp} />
    </div>
  );
}
