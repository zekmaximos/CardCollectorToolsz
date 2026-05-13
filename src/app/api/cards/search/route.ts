import { NextResponse } from "next/server";

const BASE_URL = "https://api.pokemontcg.io/v2/cards";
const SELECT = "id,name,number,rarity,images,set,tcgplayer,cardmarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Informe um termo de busca." }, { status: 400 });
  }

  const upstreamUrl = new URL(BASE_URL);
  upstreamUrl.searchParams.set("q", `name:${query}*`);
  upstreamUrl.searchParams.set("pageSize", "20");
  upstreamUrl.searchParams.set("select", SELECT);

  const headers: HeadersInit = {};
  if (process.env.POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
  }

  try {
    const response = await fetch(upstreamUrl, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "A API Pokemon TCG nao respondeu corretamente." },
        { status: response.status },
      );
    }

    const payload = await response.json();
    return NextResponse.json({ data: payload.data ?? [] });
  } catch {
    return NextResponse.json({ error: "Nao foi possivel buscar cartas agora." }, { status: 502 });
  }
}
