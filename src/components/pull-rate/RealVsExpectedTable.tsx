import { formatOdds } from "@/lib/pull-rate/math";
import type { PullRateStats } from "@/lib/pull-rate/data";

export function RealVsExpectedTable({ stats }: { stats: PullRateStats }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Resultado real vs esperado</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">Raridade</th>
              <th className="px-3 py-2">Pull rate teorico</th>
              <th className="px-3 py-2">Boosters</th>
              <th className="px-3 py-2">Esperado</th>
              <th className="px-3 py-2">Real</th>
              <th className="px-3 py-2">Diferenca</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.realVsExpected.length === 0 ? (
              <tr><td className="px-3 py-4 text-slate-500" colSpan={7}>Sem colecoes com pull rate correspondente aos boosters cadastrados.</td></tr>
            ) : stats.realVsExpected.map((row) => (
              <tr key={`${row.rate.set_slug}-${row.rate.rarity_slug}`} className="border-t border-slate-100">
                <td className="px-3 py-2">{row.rate.set_name} / {row.rate.rarity_name}</td>
                <td className="px-3 py-2">{formatOdds(Number(row.rate.odds_one_in))}</td>
                <td className="px-3 py-2">{row.applicableBoosters}</td>
                <td className="px-3 py-2">{row.expectedHits.toFixed(2)}</td>
                <td className="px-3 py-2">{row.actualHits}</td>
                <td className="px-3 py-2">{row.difference.toFixed(2)}</td>
                <td className="px-3 py-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
