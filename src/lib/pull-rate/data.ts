import { money } from "@/lib/format";
import type { Expense, PullRate, UserCard } from "@/types";
import {
  chanceAtLeastOne,
  classifyOpening,
  classifyPerformanceDelta,
  costPerHit,
  expectedHits,
  oddsToProbability,
  realHitRate,
} from "./math";

export type PullRateStats = ReturnType<typeof buildPullRateStats>;

const premiumSlugs = new Set([
  "sir_sar",
  "hyper_rare",
  "mega_hyper_rare",
  "black_white_rare",
  "master_ball",
]);

const majorSlugs = new Set([
  "double_rare_ex",
  "ultra_rare",
  "illustration_rare",
  "sir_sar",
  "hyper_rare",
  "mega_hyper_rare",
  "black_white_rare",
  "master_ball",
]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeHitType(value: string | null | undefined) {
  const slug = slugify(value ?? "").replace(/-/g, "_");

  if (slug === "ex" || slug === "double_rare" || slug === "double_rare_ex") {
    return "double_rare_ex";
  }

  if (slug === "sir" || slug === "sar" || slug === "sir_sar" || slug === "special_illustration_rare") {
    return "sir_sar";
  }

  if (slug === "full_art") {
    return "ultra_rare";
  }

  if (slug === "secret_rare") {
    return "hyper_rare";
  }

  return slug || "major_hit";
}

function collectionSlug(expense: Expense) {
  return slugify(expense.item_name || "Sem colecao");
}

function hitCounts(expense: Expense) {
  const quantity = Math.max(1, Number(expense.quantity ?? 1));

  if (!expense.has_hit) {
    return {
      quantity,
      majorHits: 0,
      premiumHits: 0,
      raritySlug: null,
    };
  }

  const raritySlug = normalizeHitType(expense.hit_type);
  const premiumHits = premiumSlugs.has(raritySlug) ? 1 : 0;
  const majorHits = majorSlugs.has(raritySlug) || premiumHits > 0 || Boolean(expense.has_hit) ? 1 : 0;

  return {
    quantity,
    majorHits,
    premiumHits,
    raritySlug,
  };
}

function sortByDate(expenses: Expense[]) {
  return [...expenses].sort((a, b) => {
    const dateDiff = a.expense_date.localeCompare(b.expense_date);
    return dateDiff || a.created_at.localeCompare(b.created_at);
  });
}

function calculateStreaks(boosterExpenses: Expense[]) {
  let currentNoMajor = 0;
  let currentNoPremium = 0;
  let longestNoMajor = 0;
  let longestNoPremium = 0;
  let lastMajorHit: string | null = null;
  let lastPremiumHit: string | null = null;
  let lastSirSar: string | null = null;
  let lastHyperRare: string | null = null;

  for (const expense of sortByDate(boosterExpenses)) {
    const hits = hitCounts(expense);
    const dryBoostersBeforeHit = hits.majorHits > 0 ? Math.max(0, hits.quantity - 1) : hits.quantity;
    const dryPremiumBeforeHit = hits.premiumHits > 0 ? Math.max(0, hits.quantity - 1) : hits.quantity;

    currentNoMajor += dryBoostersBeforeHit;
    currentNoPremium += dryPremiumBeforeHit;
    longestNoMajor = Math.max(longestNoMajor, currentNoMajor);
    longestNoPremium = Math.max(longestNoPremium, currentNoPremium);

    if (hits.majorHits > 0) {
      lastMajorHit = `${expense.expense_date} - ${expense.item_name}`;
      currentNoMajor = 0;
    }

    if (hits.premiumHits > 0) {
      lastPremiumHit = `${expense.expense_date} - ${expense.item_name}`;
      currentNoPremium = 0;
    }

    if (hits.raritySlug === "sir_sar") {
      lastSirSar = `${expense.expense_date} - ${expense.item_name}`;
    }

    if (hits.raritySlug === "hyper_rare" || hits.raritySlug === "mega_hyper_rare") {
      lastHyperRare = `${expense.expense_date} - ${expense.item_name}`;
    }
  }

  return {
    currentNoMajor,
    currentNoPremium,
    longestNoMajor,
    longestNoPremium,
    lastMajorHit,
    lastPremiumHit,
    lastSirSar,
    lastHyperRare,
  };
}

export function buildPullRateStats(expenses: Expense[], pullRates: PullRate[], userCards: UserCard[] = []) {
  const boosterExpenses = expenses.filter((expense) => expense.category === "booster");
  const activeRates = pullRates.filter((rate) => rate.is_active);
  const ratesBySet = new Map<string, PullRate[]>();

  for (const rate of activeRates) {
    ratesBySet.set(rate.set_slug, [...(ratesBySet.get(rate.set_slug) ?? []), rate]);
  }

  const totalBoosters = boosterExpenses.reduce((sum, expense) => sum + Math.max(1, Number(expense.quantity ?? 1)), 0);
  const totalSpent = boosterExpenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const averageBoosterCost = totalBoosters > 0 ? totalSpent / totalBoosters : 0;
  const totalMajorHits = boosterExpenses.reduce((sum, expense) => sum + hitCounts(expense).majorHits, 0);
  const totalPremiumHits = boosterExpenses.reduce((sum, expense) => sum + hitCounts(expense).premiumHits, 0);
  const estimatedHitValue = userCards.reduce((sum, card) => sum + Number(card.user_value ?? 0) * Number(card.quantity ?? 0), 0);

  const byCollection = new Map<string, {
    setName: string;
    setSlug: string;
    boosters: number;
    spent: number;
    majorHits: number;
    premiumHits: number;
    dry: number;
    positive: number;
    premium: number;
  }>();
  const hitsByRarity = new Map<string, number>();

  for (const expense of boosterExpenses) {
    const setSlug = collectionSlug(expense);
    const hits = hitCounts(expense);
    const opening = classifyOpening(hits);
    const current = byCollection.get(setSlug) ?? {
      setName: expense.item_name,
      setSlug,
      boosters: 0,
      spent: 0,
      majorHits: 0,
      premiumHits: 0,
      dry: 0,
      positive: 0,
      premium: 0,
    };

    current.boosters += hits.quantity;
    current.spent += Number(expense.amount ?? 0);
    current.majorHits += hits.majorHits;
    current.premiumHits += hits.premiumHits;
    current.dry += opening === "Seco" ? hits.quantity : Math.max(0, hits.quantity - 1);
    current.positive += opening === "Positivo" ? 1 : 0;
    current.premium += opening === "Premium" ? 1 : 0;
    byCollection.set(setSlug, current);

    if (hits.raritySlug && hits.majorHits > 0) {
      hitsByRarity.set(hits.raritySlug, (hitsByRarity.get(hits.raritySlug) ?? 0) + hits.majorHits);
    }
  }

  const collectionPerformance = [...byCollection.values()].map((collection) => {
    const majorRates = (ratesBySet.get(collection.setSlug) ?? []).filter((rate) => rate.is_major_hit);
    const premiumRates = (ratesBySet.get(collection.setSlug) ?? []).filter((rate) => rate.is_premium_hit);
    const expectedMajor = majorRates.reduce((sum, rate) => sum + expectedHits(oddsToProbability(Number(rate.odds_one_in)), collection.boosters), 0);
    const expectedPremium = premiumRates.reduce((sum, rate) => sum + expectedHits(oddsToProbability(Number(rate.odds_one_in)), collection.boosters), 0);

    return {
      ...collection,
      hitRate: realHitRate(collection.majorHits, collection.boosters),
      premiumHitRate: realHitRate(collection.premiumHits, collection.boosters),
      costPerMajorHit: costPerHit(collection.spent, collection.majorHits),
      costPerPremiumHit: costPerHit(collection.spent, collection.premiumHits),
      expectedMajor,
      expectedPremium,
      status: classifyPerformanceDelta(collection.majorHits, expectedMajor),
    };
  });

  const realVsExpected = activeRates.map((rate) => {
    const applicableBoosters = collectionPerformance.find((collection) => collection.setSlug === rate.set_slug)?.boosters ?? 0;
    const actualHits = [...boosterExpenses]
      .filter((expense) => collectionSlug(expense) === rate.set_slug && hitCounts(expense).raritySlug === rate.rarity_slug)
      .reduce((sum, expense) => sum + hitCounts(expense).majorHits, 0);
    const expected = expectedHits(oddsToProbability(Number(rate.odds_one_in)), applicableBoosters);

    return {
      rate,
      applicableBoosters,
      expectedHits: expected,
      actualHits,
      difference: actualHits - expected,
      status: classifyPerformanceDelta(actualHits, expected),
    };
  }).filter((row) => row.applicableBoosters > 0);

  const timeline = sortByDate(boosterExpenses).reduce<{
    date: string;
    boosters: number;
    cumulativeBoosters: number;
    spent: number;
    cumulativeSpent: number;
    majorHits: number;
    premiumHits: number;
  }[]>((rows, expense) => {
    const hits = hitCounts(expense);
    const previous = rows.at(-1);
    rows.push({
      date: expense.expense_date,
      boosters: hits.quantity,
      cumulativeBoosters: (previous?.cumulativeBoosters ?? 0) + hits.quantity,
      spent: Number(expense.amount ?? 0),
      cumulativeSpent: (previous?.cumulativeSpent ?? 0) + Number(expense.amount ?? 0),
      majorHits: hits.majorHits,
      premiumHits: hits.premiumHits,
    });
    return rows;
  }, []);

  const defaultSirSar = activeRates.find((rate) => rate.rarity_slug === "sir_sar");
  const sirSarChanceTimeline = timeline.map((row) => ({
    date: row.date,
    boosters: row.cumulativeBoosters,
    chance: defaultSirSar ? chanceAtLeastOne(oddsToProbability(Number(defaultSirSar.odds_one_in)), row.cumulativeBoosters) * 100 : 0,
  }));

  const bestCollection = [...collectionPerformance].sort((a, b) => b.hitRate - a.hitRate)[0];
  const highestSpendCollection = [...collectionPerformance].sort((a, b) => b.spent - a.spent)[0];
  const costMajor = costPerHit(totalSpent, totalMajorHits);

  const insights = [
    totalBoosters > 0
      ? `Voce abriu ${totalBoosters} boosters. Seu hit rate geral esta em ${(realHitRate(totalMajorHits, totalBoosters) * 100).toFixed(2)}%.`
      : "Ainda nao ha boosters cadastrados para calcular pull rate.",
    costMajor !== null ? `Seu custo medio por major hit esta em ${money(costMajor)}.` : "Ainda nao ha major hits suficientes para calcular custo por hit.",
    bestCollection ? `Sua melhor colecao por taxa de hit e ${bestCollection.setName}.` : null,
    highestSpendCollection ? `Sua colecao com maior gasto acumulado e ${highestSpendCollection.setName}.` : null,
    totalBoosters > 0 ? `Voce esta ha ${calculateStreaks(boosterExpenses).currentNoMajor} boosters sem major hit.` : null,
  ].filter(Boolean) as string[];

  return {
    pullRates: activeRates,
    boosterExpenses,
    totalBoosters,
    totalSpent,
    averageBoosterCost,
    totalMajorHits,
    totalPremiumHits,
    hitRate: realHitRate(totalMajorHits, totalBoosters),
    premiumHitRate: realHitRate(totalPremiumHits, totalBoosters),
    costPerMajorHit: costPerHit(totalSpent, totalMajorHits),
    costPerPremiumHit: costPerHit(totalSpent, totalPremiumHits),
    estimatedHitValue,
    estimatedNetResult: estimatedHitValue - totalSpent,
    collectionPerformance,
    realVsExpected,
    hitsByRarity: [...hitsByRarity.entries()].map(([rarity, hits]) => ({ rarity, hits })),
    streaks: calculateStreaks(boosterExpenses),
    timeline,
    sirSarChanceTimeline,
    insights,
  };
}
