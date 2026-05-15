import { Lightbulb } from "lucide-react";
import type { PullRateStats } from "@/lib/pull-rate/data";

export function AutoInsightsPanel({ stats }: { stats: PullRateStats }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-5 text-amber-600" />
        <h2 className="font-semibold text-slate-950">Insights automaticos</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {stats.insights.map((insight) => (
          <p key={insight} className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">{insight}</p>
        ))}
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Probabilidade nao garante resultado. Uma sequencia seca pode ser normal mesmo quando a chance acumulada parece alta.
        </p>
      </div>
    </section>
  );
}
