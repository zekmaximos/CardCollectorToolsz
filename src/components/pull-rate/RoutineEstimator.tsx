"use client";

import { useMemo, useState } from "react";
import type { PullRate } from "@/types";
import { boostersForTargetChance, formatOdds, oddsToProbability } from "@/lib/pull-rate/math";

export function RoutineEstimator({ pullRates }: { pullRates: PullRate[] }) {
  const [boostersPerDay, setBoostersPerDay] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [setSlug, setSetSlug] = useState(pullRates[0]?.set_slug ?? "");
  const ratesForSet = pullRates.filter((rate) => rate.set_slug === setSlug);
  const [raritySlug, setRaritySlug] = useState(ratesForSet.find((rate) => rate.rarity_slug === "sir_sar")?.rarity_slug ?? ratesForSet[0]?.rarity_slug ?? "");
  const selectedRate = useMemo(
    () => pullRates.find((rate) => rate.set_slug === setSlug && rate.rarity_slug === raritySlug) ?? ratesForSet[0] ?? pullRates[0],
    [pullRates, raritySlug, ratesForSet, setSlug],
  );

  if (!selectedRate) {
    return null;
  }

  const weeklyBoosters = Math.max(0.01, boostersPerDay * daysPerWeek);
  const probability = oddsToProbability(Number(selectedRate.odds_one_in));
  const averageWeeks = Number(selectedRate.odds_one_in) / weeklyBoosters;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">Estimador de rotina</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input value={boostersPerDay} onChange={(event) => setBoostersPerDay(Number(event.target.value))} min="0" step="0.5" type="number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" aria-label="Boosters por dia" />
        <input value={daysPerWeek} onChange={(event) => setDaysPerWeek(Number(event.target.value))} min="1" max="7" type="number" className="rounded-md border border-slate-300 px-3 py-2 text-sm" aria-label="Dias por semana" />
        <select value={setSlug} onChange={(event) => setSetSlug(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {[...new Map(pullRates.map((rate) => [rate.set_slug, rate.set_name])).entries()].map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>
        <select value={selectedRate.rarity_slug} onChange={(event) => setRaritySlug(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {ratesForSet.map((rate) => (
            <option key={rate.rarity_slug} value={rate.rarity_slug}>{rate.rarity_name}</option>
          ))}
        </select>
      </div>
      <p className="mt-3 text-sm text-slate-600">{selectedRate.rarity_name}: {formatOdds(Number(selectedRate.odds_one_in))}. Rotina atual: {weeklyBoosters.toFixed(1)} boosters/semana.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Tempo medio esperado" value={`${averageWeeks.toFixed(1)} semanas`} />
        {[50, 80, 90, 95].map((target) => {
          const boosters = boostersForTargetChance(probability, target / 100);
          return <Metric key={target} label={`${target}% de chance`} value={`${Math.ceil(boosters / weeklyBoosters)} semanas (${boosters} boosters)`} />;
        })}
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
