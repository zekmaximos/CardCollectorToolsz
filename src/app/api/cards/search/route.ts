import { NextResponse } from "next/server";

const TCGDEX_BASE_URL = "https://api.tcgdex.net/v2";
const POKEMON_TCG_BASE_URL = "https://api.pokemontcg.io/v2/cards";
const POKEMON_TCG_SELECT = "id,name,number,rarity,images,set,tcgplayer,cardmarket";

const languageConfig = {
  "Inglês": { code: "en", label: "Inglês", pricePriority: ["tcgplayer", "cardmarket"] },
  "Português": { code: "pt-br", label: "Português", pricePriority: ["cardmarket", "tcgplayer"] },
  "Japonês": { code: "ja", label: "Japonês", pricePriority: ["cardmarket", "tcgplayer"] },
  en: { code: "en", label: "Inglês", pricePriority: ["tcgplayer", "cardmarket"] },
  "pt-br": { code: "pt-br", label: "Português", pricePriority: ["cardmarket", "tcgplayer"] },
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
  searchUrl.searchParams.set("pagination:itemsPerPage", "20");

  const response = await fetch(searchUrl, { next: { revalidate: 300 } });
  if (!response.ok) {
    throw new Error("A TCGdex nao respondeu corretamente.");
  }

  const briefs = (await response.json()) as TcgDexBrief[];
  const details = await Promise.all(
    briefs.slice(0, 20).map(async (brief) => {
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

function buildPokemonTcgNameQuery(query: string) {
  const normalized = query.replace(/\s+/g, " ").trim();
  const escaped = normalized.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  if (/^[\p{L}\p{N}-]+$/u.test(normalized)) {
    return `name:${escaped}*`;
  }

  return `name:"${escaped}"`;
}

async function searchPokemonTcgFallback(query: string) {
  const upstreamUrl = new URL(POKEMON_TCG_BASE_URL);
  upstreamUrl.searchParams.set("q", buildPokemonTcgNameQuery(query));
  upstreamUrl.searchParams.set("pageSize", "20");
  upstreamUrl.searchParams.set("select", POKEMON_TCG_SELECT);

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
  return payload.data ?? [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const language = resolveLanguage(searchParams.get("lang"));

  if (!query) {
    return NextResponse.json({ error: "Informe um termo de busca." }, { status: 400 });
  }

  try {
    const tcgDexResults = await searchTcgDex(query, language);

    if (tcgDexResults.length > 0) {
      return NextResponse.json({ data: tcgDexResults });
    }

    if (language.code === "en") {
      return NextResponse.json({ data: await searchPokemonTcgFallback(query) });
    }

    return NextResponse.json({ data: [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel buscar cartas agora.",
      },
      { status: 502 },
    );
  }
}
