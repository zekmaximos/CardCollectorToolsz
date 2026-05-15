export type PerformanceLabel =
  | "Muito acima da media"
  | "Acima da media"
  | "Dentro do esperado"
  | "Abaixo da media"
  | "Muito abaixo da media"
  | "Sem base suficiente";

export type OpeningLabel = "Seco" | "Positivo" | "Premium";

export function oddsToProbability(oddsOneIn: number) {
  return oddsOneIn > 0 ? 1 / oddsOneIn : 0;
}

export function probabilityToPercent(probability: number, decimals = 2) {
  return `${(Math.max(0, probability) * 100).toFixed(decimals)}%`;
}

export function chanceAtLeastOne(probability: number, boosters: number) {
  if (probability <= 0 || boosters <= 0) {
    return 0;
  }

  return 1 - Math.pow(1 - probability, boosters);
}

export function boostersForTargetChance(probability: number, targetChance: number) {
  if (probability <= 0 || probability >= 1 || targetChance <= 0) {
    return 0;
  }

  if (targetChance >= 1) {
    return Infinity;
  }

  return Math.ceil(Math.log(1 - targetChance) / Math.log(1 - probability));
}

export function expectedHits(probability: number, boosters: number) {
  return Math.max(0, boosters) * Math.max(0, probability);
}

export function realHitRate(actualHits: number, totalBoosters: number) {
  return totalBoosters > 0 ? actualHits / totalBoosters : 0;
}

export function costPerHit(totalSpent: number, totalHits: number) {
  return totalHits > 0 ? totalSpent / totalHits : null;
}

export function formatOdds(oddsOneIn: number) {
  const rounded = Number.isInteger(oddsOneIn) ? String(oddsOneIn) : oddsOneIn.toFixed(1).replace(".", ",");
  return `1 em ${rounded}`;
}

export function classifyPerformanceDelta(actualHits: number, expectedHitCount: number): PerformanceLabel {
  if (expectedHitCount <= 0) {
    return "Sem base suficiente";
  }

  const deltaPercent = (actualHits - expectedHitCount) / expectedHitCount;

  if (deltaPercent > 0.75) {
    return "Muito acima da media";
  }

  if (deltaPercent > 0.2) {
    return "Acima da media";
  }

  if (deltaPercent < -0.75) {
    return "Muito abaixo da media";
  }

  if (deltaPercent < -0.2) {
    return "Abaixo da media";
  }

  return "Dentro do esperado";
}

export function classifyOpening(hits: { majorHits?: number; premiumHits?: number }): OpeningLabel {
  if (Number(hits.premiumHits ?? 0) > 0) {
    return "Premium";
  }

  if (Number(hits.majorHits ?? 0) > 0) {
    return "Positivo";
  }

  return "Seco";
}
