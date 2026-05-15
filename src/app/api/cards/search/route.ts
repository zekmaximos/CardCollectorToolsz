import { NextResponse } from "next/server";

const TCGDEX_BASE_URL = "https://api.tcgdex.net/v2";
const POKEMON_TCG_BASE_URL = "https://api.pokemontcg.io/v2/cards";
const POKEAPI_SPECIES_BASE_URL = "https://pokeapi.co/api/v2/pokemon-species";
const POKEMON_TCG_SELECT = "id,name,number,rarity,images,set,tcgplayer,cardmarket";
const MAX_RESULTS = 40;

const languageConfig = {
  "Inglês": { code: "en", label: "Inglês", pricePriority: ["tcgplayer", "cardmarket"] },
  "Português": { code: "pt-br", label: "Português (Brasil)", pricePriority: ["cardmarket", "tcgplayer"] },
  "Português (Brasil)": { code: "pt-br", label: "Português (Brasil)", pricePriority: ["cardmarket", "tcgplayer"] },
  "Japonês": { code: "ja", label: "Japonês", pricePriority: ["cardmarket", "tcgplayer"] },
  en: { code: "en", label: "Inglês", pricePriority: ["tcgplayer", "cardmarket"] },
  "pt-br": { code: "pt-br", label: "Português (Brasil)", pricePriority: ["cardmarket", "tcgplayer"] },
  ja: { code: "ja", label: "Japonês", pricePriority: ["cardmarket", "tcgplayer"] },
} as const;

type TcgDexBrief = {
  id: string;
  localId?: string | number;
  name: string;
  image?: string;
};

type TcgDexCard = TcgDexBrief & {
  rarity?: string;
  set?: {
    id?: string;
    name?: string;
  };
  pricing?: {
    cardmarket?: Record<string, unknown> | null;
    tcgplayer?: Record<string, unknown> | null;
  } | null;
};

type MarketPrice = {
  amount: number;
  currency: string;
  source: string;
} | null;

type PokemonTcgCard = {
  id: string;
  name: string;
  number?: string | null;
  rarity?: string | null;
  images?: {
    small?: string;
    large?: string;
  } | null;
  set?: {
    id?: string;
    name?: string;
    series?: string;
    releaseDate?: string;
  } | null;
  tcgplayer?: {
    prices?: Record<string, { market?: number | null } | undefined>;
  } | null;
  cardmarket?: {
    prices?: {
      averageSellPrice?: number | null;
      avg1?: number | null;
      avg7?: number | null;
      avg30?: number | null;
    };
  } | null;
};

function resolveLanguage(value: string | null) {
  return languageConfig[(value ?? "Inglês") as keyof typeof languageConfig] ?? languageConfig["Inglês"];
}

function numberField(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pickCardmarketPrice(pricing: Record<string, unknown> | null | undefined): MarketPrice {
  if (!pricing) {
    return null;
  }

  const amount =
    numberField(pricing.trend) ??
    numberField(pricing.avg30) ??
    numberField(pricing.avg7) ??
    numberField(pricing.avg) ??
    numberField(pricing.low) ??
    numberField(pricing["trend-holo"]) ??
    numberField(pricing["avg30-holo"]) ??
    numberField(pricing["avg7-holo"]) ??
    numberField(pricing["avg-holo"]) ??
    numberField(pricing["low-holo"]);

  if (amount === null) {
    return null;
  }

  return {
    amount,
    currency: String(pricing.unit ?? "EUR"),
    source: "Cardmarket",
  };
}

function pickTcgplayerPrice(pricing: Record<string, unknown> | null | undefined): MarketPrice {
  if (!pricing) {
    return null;
  }

  const variantNames = [
    "normal",
    "holofoil",
    "reverse-holofoil",
    "1st-edition",
    "1st-edition-holofoil",
    "unlimited",
    "unlimited-holofoil",
  ];

  for (const variantName of variantNames) {
    const variant = pricing[variantName];
    if (!variant || typeof variant !== "object") {
      continue;
    }

    const variantPricing = variant as Record<string, unknown>;
    const amount =
      numberField(variantPricing.marketPrice) ??
      numberField(variantPricing.midPrice) ??
      numberField(variantPricing.lowPrice) ??
      numberField(variantPricing.directLowPrice) ??
      numberField(variantPricing.highPrice);

    if (amount !== null) {
      return {
        amount,
        currency: String(pricing.unit ?? "USD"),
        source: `TCGplayer ${variantName}`,
      };
    }
  }

  return null;
}

function pickMarketPrice(card: TcgDexCard, priority: readonly string[]): MarketPrice {
  for (const source of priority) {
    const price =
      source === "tcgplayer"
        ? pickTcgplayerPrice(card.pricing?.tcgplayer)
        : pickCardmarketPrice(card.pricing?.cardmarket);

    if (price) {
      return price;
    }
  }

  return null;
}

function tcgDexImage(image: string | undefined, size: "low" | "high") {
  return image ? `${image}/${size}.png` : undefined;
}

function normalizeTcgDexCard(card: TcgDexCard, language: ReturnType<typeof resolveLanguage>) {
  const price = pickMarketPrice(card, language.pricePriority);

  return {
    id: card.id,
    source: "tcgdex",
    language: language.label,
    name: card.name,
    number: String(card.localId ?? ""),
    rarity: card.rarity ?? null,
    images: {
      small: tcgDexImage(card.image, "low"),
      large: tcgDexImage(card.image, "high"),
    },
    set: {
      id: card.set?.id,
      name: card.set?.name,
    },
    marketPrice: price,
  };
}

async function searchTcgDex(query: string, language: ReturnType<typeof resolveLanguage>) {
  const searchUrl = new URL(`${TCGDEX_BASE_URL}/${language.code}/cards`);
  searchUrl.searchParams.set("name", query);
  searchUrl.searchParams.set("pagination:itemsPerPage", String(MAX_RESULTS));

  const response = await fetch(searchUrl, { next: { revalidate: 300 } });
  if (!response.ok) {
    throw new Error("A TCGdex nao respondeu corretamente.");
  }

  const briefs = (await response.json()) as TcgDexBrief[];
  const details = await Promise.all(
    briefs.slice(0, MAX_RESULTS).map(async (brief) => {
      try {
        const detailResponse = await fetch(`${TCGDEX_BASE_URL}/${language.code}/cards/${brief.id}`, {
          next: { revalidate: 300 },
        });

        if (!detailResponse.ok) {
          return brief as TcgDexCard;
        }

        return (await detailResponse.json()) as TcgDexCard;
      } catch {
        return brief as TcgDexCard;
      }
    }),
  );

  return details.map((card) => normalizeTcgDexCard(card, language));
}

function pokemonNameCandidates(query: string) {
  const stopWords = new Set(["mega", "ex", "gx", "v", "vmax", "vstar", "x", "y"]);

  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2 && !stopWords.has(part))
    .slice(0, 5);
}

async function japanesePokemonNameFromEnglishQuery(query: string) {
  for (const candidate of pokemonNameCandidates(query)) {
    try {
      const response = await fetch(`${POKEAPI_SPECIES_BASE_URL}/${encodeURIComponent(candidate)}`, {
        next: { revalidate: 86_400 },
      });

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as {
        names?: { language?: { name?: string }; name?: string }[];
      };
      const japaneseName = payload.names?.find((name) => name.language?.name === "ja")?.name;

      if (japaneseName) {
        return japaneseName;
      }
    } catch {
      // Keep the search flow resilient when PokeAPI is unavailable.
    }
  }

  return null;
}

function buildPokemonTcgNameQuery(query: string) {
  const normalized = query.replace(/\s+/g, " ").trim();
  const escaped = normalized.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  if (/^[\p{L}\p{N}-]+$/u.test(normalized)) {
    return `name:${escaped}*`;
  }

  return `name:"${escaped}"`;
}

function pickPokemonTcgMarketPrice(card: PokemonTcgCard): MarketPrice {
  const tcgPrices = Object.values(card.tcgplayer?.prices ?? {});
  const tcgMarket = tcgPrices.find((price) => typeof price?.market === "number")?.market;

  if (typeof tcgMarket === "number") {
    return {
      amount: tcgMarket,
      currency: "USD",
      source: "TCGplayer",
    };
  }

  const cardmarketPrice = card.cardmarket?.prices?.averageSellPrice ?? card.cardmarket?.prices?.avg7;
  if (typeof cardmarketPrice === "number") {
    return {
      amount: cardmarketPrice,
      currency: "EUR",
      source: "Cardmarket",
    };
  }

  return null;
}

function normalizePokemonTcgCard(
  card: PokemonTcgCard,
  language: ReturnType<typeof resolveLanguage> = languageConfig.en,
  referenceOnly = false,
) {
  const price = pickPokemonTcgMarketPrice(card);

  return {
    ...card,
    source: referenceOnly ? "pokemontcg_reference" : "pokemontcg",
    language: language.label,
    marketPrice: price
      ? {
          ...price,
          source: language.code === "en" ? price.source : `${price.source} referencia EN`,
        }
      : null,
  };
}

async function searchPokemonTcg(
  query: string,
  language: ReturnType<typeof resolveLanguage> = languageConfig.en,
  referenceOnly = false,
) {
  const upstreamUrl = new URL(POKEMON_TCG_BASE_URL);
  upstreamUrl.searchParams.set("q", buildPokemonTcgNameQuery(query));
  upstreamUrl.searchParams.set("pageSize", String(MAX_RESULTS));
  upstreamUrl.searchParams.set("select", POKEMON_TCG_SELECT);
  upstreamUrl.searchParams.set("orderBy", "-set.releaseDate");

  const headers: HeadersInit = {};
  if (process.env.POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
  }

  const response = await fetch(upstreamUrl, {
    headers,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  return ((payload.data ?? []) as PokemonTcgCard[]).map((card) =>
    normalizePokemonTcgCard(card, language, referenceOnly),
  );
}

type NormalizedSearchCard =
  | ReturnType<typeof normalizePokemonTcgCard>
  | ReturnType<typeof normalizeTcgDexCard>;

function mergeCards(primary: NormalizedSearchCard[], secondary: NormalizedSearchCard[]) {
  const seen = new Set<string>();
  const merged: NormalizedSearchCard[] = [];

  for (const card of [...primary, ...secondary]) {
    if (seen.has(card.id)) {
      continue;
    }

    seen.add(card.id);
    merged.push(card);
  }

  return merged.slice(0, MAX_RESULTS);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const language = resolveLanguage(searchParams.get("lang"));
  const includeReferences = searchParams.get("includeReferences") === "true";

  if (!query) {
    return NextResponse.json({ error: "Informe um termo de busca." }, { status: 400 });
  }

  try {
    if (language.code === "en") {
      const [pokemonTcgResults, tcgDexResults] = await Promise.all([
        searchPokemonTcg(query).catch(() => []),
        searchTcgDex(query, language).catch(() => []),
      ]);

      return NextResponse.json({ data: mergeCards(pokemonTcgResults, tcgDexResults) });
    }

    if (language.code === "pt-br") {
      const tcgDexResults = await searchTcgDex(query, language).catch(() => []);

      if (tcgDexResults.length > 0 && !includeReferences) {
        return NextResponse.json({ data: tcgDexResults });
      }

      if (tcgDexResults.length > 0) {
        const referenceResults = await searchPokemonTcg(query, language, true).catch(() => []);
        return NextResponse.json({ data: mergeCards(tcgDexResults, referenceResults) });
      }

      return NextResponse.json({
        data: await searchPokemonTcg(query, language, true).catch(() => []),
      });
    }

    const tcgDexResults = await searchTcgDex(query, language);

    if (tcgDexResults.length > 0) {
      return NextResponse.json({ data: tcgDexResults });
    }

    if (language.code === "ja") {
      const japaneseQuery = await japanesePokemonNameFromEnglishQuery(query);

      if (japaneseQuery && japaneseQuery !== query) {
        const translatedResults = await searchTcgDex(japaneseQuery, language).catch(() => []);

        if (translatedResults.length > 0) {
          return NextResponse.json({ data: translatedResults });
        }
      }
    }

    return NextResponse.json({ data: await searchPokemonTcg(query, language).catch(() => []) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel buscar cartas agora.",
      },
      { status: 502 },
    );
  }
}
