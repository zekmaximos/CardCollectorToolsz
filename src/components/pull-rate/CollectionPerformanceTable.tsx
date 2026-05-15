import { money } from "@/lib/format";
import { probabilityToPercent } from "@/lib/pull-rate/math";
import type { PullRateStats } from "@/lib/pull-rate/data";

export function CollectionPerformanceTable({ stats }: { stats: PullRateStats }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Performance por colecao</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">Colecao</th>
              <th className="px-3 py-2">Boosters</th>
              <th className="px-3 py-2">Total gasto</th>
              <th className="px-3 py-2">Major hits</th>
              <th className="px-3 py-2">Premium hits</th>
              <th className="px-3 py-2">Hit rate</th>
              <th className="px-3 py-2">Premium rate</th>
              <th className="px-3 py-2">Custo/major</th>
              <th className="px-3 py-2">Custo/premium</th>
              <th className="px-3 py-2">Esperado</th>
              <th className="px-3 py-2">Real</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.collectionPerformance.length === 0 ? (
              <tr><td className="px-3 py-4 text-slate-500" colSpan={12}>Sem boosters cadastrados.</td></tr>
            ) : stats.collectionPerformance.map((row) => (
              <tr key={row.setSlug} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-950">{row.setName}</td>
                <td className="px-3 py-2">{row.boosters}</td>
                <td className="px-3 py-2">{money(row.spent)}</td>
                <td className="px-3 py-2">{row.majorHits}</td>
                <td className="px-3 py-2">{row.premiumHits}</td>
                <td className="px-3 py-2">{probabilityToPercent(row.hitRate)}</td>
                <td className="px-3 py-2">{probabilityToPercent(row.premiumHitRate)}</td>
                <td className="px-3 py-2">{row.costPerMajorHit === null ? "-" : money(row.costPerMajorHit)}</td>
                <td className="px-3 py-2">{row.costPerPremiumHit === null ? "-" : money(row.costPerPremiumHit)}</td>
                <td className="px-3 py-2">{row.expectedMajor.toFixed(2)}</td>
                <td className="px-3 py-2">{row.majorHits}</td>
                <td className="px-3 py-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
