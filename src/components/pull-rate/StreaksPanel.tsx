import type { PullRateStats } from "@/lib/pull-rate/data";

export function StreaksPanel({ stats }: { stats: PullRateStats }) {
  const rows = [
    ["Sequencia atual sem major hit", `${stats.streaks.currentNoMajor} boosters`],
    ["Sequencia atual sem premium hit", `${stats.streaks.currentNoPremium} boosters`],
    ["Maior sequencia sem major hit", `${stats.streaks.longestNoMajor} boosters`],
    ["Maior sequencia sem premium hit", `${stats.streaks.longestNoPremium} boosters`],
    ["Ultimo major hit", stats.streaks.lastMajorHit ?? "-"],
    ["Ultimo premium hit", stats.streaks.lastPremiumHit ?? "-"],
    ["Ultima SIR/SAR", stats.streaks.lastSirSar ?? "-"],
    ["Ultima Hyper Rare", stats.streaks.lastHyperRare ?? "-"],
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Sequencias secas</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 font-semibold text-slate-950">{value}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Quando uma compra tem varios boosters e um hit, a calculadora considera os boosters anteriores como secos e o ultimo como hit.</p>
    </section>
  );
}
