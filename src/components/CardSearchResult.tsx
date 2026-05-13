"use client";

import { useMemo, useState, useTransition } from "react";
import { ImagePlus, Plus, Search } from "lucide-react";
import { addCardToAlbum } from "@/app/actions";
import { money } from "@/lib/format";
import type { Album, PokemonCardApiResult } from "@/types";

const languageOptions = ["Inglês", "Português", "Japonês"];

function priceDetails(card: PokemonCardApiResult) {
  if (card.marketPrice?.amount) {
    return card.marketPrice;
  }

  const tcgPrices = Object.values(card.tcgplayer?.prices ?? {});
  const tcgMarket = tcgPrices.find((price) => typeof price?.market === "number")?.market;
  if (tcgMarket) {
    return {
      amount: tcgMarket,
      currency: "USD",
      source: "TCGplayer",
    };
  }

  const cardmarketPrice = card.cardmarket?.prices?.averageSellPrice ?? card.cardmarket?.prices?.avg7;
  if (cardmarketPrice) {
    return {
      amount: cardmarketPrice,
      currency: "EUR",
      source: "Cardmarket",
    };
  }

  return {
    amount: 0,
    currency: "BRL",
    source: "",
  };
}

export function CardSearchResult({ albums }: { albums: Album[] }) {
  const [query, setQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0]);
  const [cards, setCards] = useState<PokemonCardApiResult[]>([]);
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState<PokemonCardApiResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasAlbums = albums.length > 0;

  function searchCards(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const q = query.trim();
    if (!q) {
      setCards([]);
      setError("Digite o nome de uma carta para buscar.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/cards/search?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(selectedLanguage)}`,
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Erro ao buscar cartas.");
        }
        setCards(payload.data ?? []);
        if (!payload.data?.length) {
          setError(
            selectedLanguage === "Japonês"
              ? "Nenhuma carta encontrada. Para cartas japonesas, tente buscar pelo nome em japones."
              : "Nenhuma carta encontrada.",
          );
        }
      } catch (err) {
        setCards([]);
        setError(err instanceof Error ? err.message : "A API externa nao respondeu.");
      }
    });
  }

  const selectedPrice = useMemo(
    () => (selectedCard ? priceDetails(selectedCard).amount : 0),
    [selectedCard],
  );
  const selectedPriceDetails = selectedCard ? priceDetails(selectedCard) : null;

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={searchCards} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, ex: charizard"
          className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <select
          value={selectedLanguage}
          onChange={(event) => setSelectedLanguage(event.target.value)}
          className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          aria-label="Nacionalidade da carta"
        >
          {languageOptions.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Search className="size-4" />
          {isPending ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error ? <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p> : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ImagePlus className="size-5 text-emerald-700" />
          <h2 className="font-semibold text-slate-950">Cadastrar carta manual</h2>
        </div>
        <form action={addCardToAlbum} className="mt-4 grid gap-3 md:grid-cols-4">
          <select name="album_id" required className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm">
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
          <input name="name" required placeholder="Nome da carta" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select
            name="language"
            defaultValue={selectedLanguage}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm"
            aria-label="Nacionalidade da carta manual"
          >
            {languageOptions.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          <input name="user_value" type="number" min="0" step="0.01" placeholder="Valor considerado" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="set_name" placeholder="Colecao/set" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="card_number" placeholder="Numero" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="rarity" placeholder="Raridade" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="market_price" type="number" min="0" step="0.01" placeholder="Valor de mercado" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="image_url" type="url" placeholder="URL da imagem de referencia" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
          <select name="market_currency" defaultValue="BRL" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" aria-label="Moeda do valor manual">
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="JPY">JPY</option>
          </select>
          <input name="paid_price" type="number" min="0" step="0.01" placeholder="Valor pago" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="condition" placeholder="Condicao" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="quantity" type="number" min="1" defaultValue="1" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <textarea name="notes" placeholder="Observacoes" className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-3" />
          <input type="hidden" name="market_source" value="Manual" />
          <button
            disabled={!hasAlbums}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="size-4" />
            Criar carta
          </button>
        </form>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {card.images?.small ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.images.small} alt={card.name} className="mx-auto h-64 rounded-md object-contain" loading="lazy" />
            ) : (
              <div className="h-64 rounded-md bg-slate-100" />
            )}
            <div className="mt-4 flex flex-1 flex-col gap-2">
              <h2 className="font-semibold text-slate-950">{card.name}</h2>
              <p className="text-sm text-slate-600">
                {card.set?.name ?? "Set desconhecido"} #{card.number ?? "-"}
              </p>
              <p className="text-sm text-slate-600">{card.rarity ?? "Sem raridade"}</p>
              <p className="text-sm font-semibold text-emerald-700">
                {money(priceDetails(card).amount, priceDetails(card).currency)}
              </p>
              {priceDetails(card).source ? <p className="text-xs text-slate-500">{priceDetails(card).source}</p> : null}
            </div>
            <button
              disabled={!hasAlbums}
              onClick={() => setSelectedCard(card)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Plus className="size-4" />
              Adicionar ao album
            </button>
          </article>
        ))}
      </div>

      {!hasAlbums ? (
        <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Crie um album antes de adicionar cartas.
        </p>
      ) : null}

      {selectedCard ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{selectedCard.name}</h2>
                <p className="text-sm text-slate-600">{selectedCard.set?.name ?? "Set desconhecido"}</p>
              </div>
              <button onClick={() => setSelectedCard(null)} className="rounded-md px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Fechar
              </button>
            </div>

            <form action={addCardToAlbum} className="mt-5 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="external_card_id" value={selectedCard.id} />
              <input type="hidden" name="name" value={selectedCard.name} />
              <input type="hidden" name="set_name" value={selectedCard.set?.name ?? ""} />
              <input type="hidden" name="card_number" value={selectedCard.number ?? ""} />
              <input type="hidden" name="rarity" value={selectedCard.rarity ?? ""} />
              <input type="hidden" name="image_url" value={selectedCard.images?.large ?? selectedCard.images?.small ?? ""} />
              <input type="hidden" name="market_price" value={selectedPrice} />
              <input type="hidden" name="market_currency" value={selectedPriceDetails?.currency ?? ""} />
              <input type="hidden" name="market_source" value={selectedPriceDetails?.source ?? ""} />
              <select name="album_id" required className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
              <select
                name="language"
                defaultValue={selectedLanguage}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                aria-label="Nacionalidade da carta"
              >
                {languageOptions.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
              <input name="condition" placeholder="Condicao" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="quantity" type="number" min="1" defaultValue="1" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="paid_price" type="number" min="0" step="0.01" placeholder="Valor pago" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="user_value" type="number" min="0" step="0.01" defaultValue={selectedPrice} placeholder={`Valor considerado (${selectedPriceDetails?.currency ?? "BRL"})`} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input name="image_url_override" type="url" placeholder="URL de imagem alternativa" className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              <textarea name="notes" placeholder="Observacoes" className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <Plus className="size-4" />
                Salvar carta
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
