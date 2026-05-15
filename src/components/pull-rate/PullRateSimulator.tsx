"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { boostersForTargetChance, chanceAtLeastOne, expectedHits, formatOdds, oddsToProbability, probabilityToPercent } from "@/lib/pull-rate/math";
import type { PullRate } from "@/types";

export function PullRateSimulator({ pullRates, averageBoosterCost }: { pullRates: PullRate[]; averageBoosterCost: number }) {
  const [mode, setMode] = useState<"boosters" | "chance">("boosters");
  const [setSlug, setSetSlug] = useState(pullRates[0]?.set_slug ?? "");
  const ratesForSet = pullRates.filter((rate) => rate.set_slug === setSlug);
  const [raritySlug, setRaritySlug] = useState(ratesForSet[0]?.rarity_slug ?? pullRates[0]?.rarity_slug ?? "");
  const [boosters, setBoosters] = useState(22);
  const [targetChance, setTargetChance] = useState(80);
  const selectedRate = useMemo(
    () => pullRates.find((rate) => rate.set_slug === setSlug && rate.rarity_slug === raritySlug) ?? ratesForSet[0] ?? pullRates[0],
    [pullRates, raritySlug, ratesForSet, setSlug],
  );

  if (!selectedRate) {
    return null;
  }

  const probability = oddsToProbability(Number(selectedRate.odds_one_in));
  const chance = chanceAtLeastOne(probability, boosters);
  const neededBoosters = boostersForTargetChance(probability, targetChance / 100);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-950">Simulador</h2>
          <div className="flex rounded-md border border-slate-200 p-1 text-sm">
            <button onClick={() => setMode("boosters")} className={`rounded px-3 py-1 ${mode === "boosters" ? "bg-slate-950 text-white" : "text-slate-600"}`}>Tenho boosters</button>
            <button onClick={() => setMode("chance")} className={`rounded px-3 py-1 ${mode === "chance" ? "bg-slate-950 text-white" : "text-slate-600"}`}>Quero chance</button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
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
          {mode === "boosters" ? (
            <input value={boosters} onChange={(event) => setBoosters(Number(event.target.value))} min="1" type="number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" aria-label="Quantidade de boosters" />
          ) : (
            <select value={targetChance} onChange={(event) => setTargetChance(Number(event.target.value))} className="rounded-md border border-slate-300 px-3 py-2 text-sm" aria-label="Chance desejada">
              {[50, 80, 90, 95].map((value) => <option key={value} value={value}>{value}%</option>)}
            </select>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {mode === "boosters" ? (
            <>
              <Metric label="Chance de pelo menos 1" value={probabilityToPercent(chance)} />
              <Metric label="Chance de nenhum" value={probabilityToPercent(1 - chance)} />
              <Metric label="Hits esperados" value={expectedHits(probability, boosters).toFixed(2)} />
            </>
          ) : (
            <>
              <Metric label="Boosters necessarios" value={String(neededBoosters)} />
              <Metric label="Custo estimado" value={money(neededBoosters * averageBoosterCost)} />
              <Metric label="Tempo estimado" value={`${Math.ceil(neededBoosters / 7)} semanas a 7/semana`} />
            </>
          )}
          <Metric label="Pull rate" value={formatOdds(Number(selectedRate.odds_one_in))} />
          <Metric label="Por booster" value={probabilityToPercent(probability)} />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-950">{value}</div>
    </div>
  );
}
