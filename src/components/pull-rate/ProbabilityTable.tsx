"use client";

import { useMemo, useState } from "react";
import type { PullRate } from "@/types";
import { chanceAtLeastOne, expectedHits, formatOdds, oddsToProbability, probabilityToPercent } from "@/lib/pull-rate/math";

const boosterSamples = [1, 5, 10, 22, 44, 52, 75, 100];

export function ProbabilityTable({ pullRates }: { pullRates: PullRate[] }) {
  const [setSlug, setSetSlug] = useState(pullRates[0]?.set_slug ?? "");
  const ratesForSet = pullRates.filter((rate) => rate.set_slug === setSlug);
  const [raritySlug, setRaritySlug] = useState(ratesForSet[0]?.rarity_slug ?? pullRates[0]?.rarity_slug ?? "");
  const selectedRate = useMemo(
    () => pullRates.find((rate) => rate.set_slug === setSlug && rate.rarity_slug === raritySlug) ?? ratesForSet[0] ?? pullRates[0],
    [pullRates, raritySlug, ratesForSet, setSlug],
  );

  if (!selectedRate) {
    return null;
  }

  const probability = oddsToProbability(Number(selectedRate.odds_one_in));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold text-slate-950">Tabela de probabilidade</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={setSlug} onChange={(event) => setSetSlug(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" aria-label="Colecao">
            {[...new Map(pullRates.map((rate) => [rate.set_slug, rate.set_name])).entries()].map(([slug, name]) => (
              <option key={slug} value={slug}>{name}</option>
            ))}
          </select>
          <select value={selectedRate.rarity_slug} onChange={(event) => setRaritySlug(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" aria-label="Raridade">
            {ratesForSet.map((rate) => (
              <option key={rate.rarity_slug} value={rate.rarity_slug}>{rate.rarity_name}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {selectedRate.rarity_name} em {selectedRate.set_name}: {formatOdds(Number(selectedRate.odds_one_in))} por booster, aproximadamente {probabilityToPercent(probability)}.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">Boosters</th>
              <th className="px-3 py-2">Chance de pelo menos 1</th>
              <th className="px-3 py-2">Chance de nenhum</th>
              <th className="px-3 py-2">Hits esperados</th>
            </tr>
          </thead>
          <tbody>
            {boosterSamples.map((boosters) => {
              const chance = chanceAtLeastOne(probability, boosters);
              return (
                <tr key={boosters} className="border-t border-slate-100">
                  <td className="px-3 py-2">{boosters}</td>
                  <td className="px-3 py-2">{probabilityToPercent(chance)}</td>
                  <td className="px-3 py-2">{probabilityToPercent(1 - chance)}</td>
                  <td className="px-3 py-2">{expectedHits(probability, boosters).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
