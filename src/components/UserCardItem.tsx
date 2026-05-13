import { Save, Trash2 } from "lucide-react";
import { removeUserCard, updateUserCard } from "@/app/actions";
import { money } from "@/lib/format";
import type { UserCard } from "@/types";

const languageOptions = ["Inglês", "Português", "Japonês"];

export function UserCardItem({ card }: { card: UserCard }) {
  const selectedLanguage = languageOptions.includes(card.language ?? "")
    ? card.language ?? ""
    : languageOptions[0];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        {card.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image_url}
            alt={card.name}
            className="h-36 w-24 shrink-0 rounded-md object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-36 w-24 shrink-0 rounded-md bg-slate-100" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-950">{card.name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {card.set_name ?? "Sem set"} #{card.card_number ?? "-"} · {card.rarity ?? "Sem raridade"}
          </p>
          {card.language ? (
            <span className="mt-2 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              {card.language}
            </span>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <span className="rounded-md bg-slate-50 p-2">Qtd: {card.quantity}</span>
            <span className="rounded-md bg-slate-50 p-2">Pago: {money((card.paid_price ?? 0) * card.quantity)}</span>
            <span className="rounded-md bg-slate-50 p-2">Valor: {money((card.user_value ?? 0) * card.quantity)}</span>
            <span className="rounded-md bg-slate-50 p-2">Mercado: {money(card.market_price)}</span>
          </div>
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-emerald-700">Editar dados pessoais</summary>
        <form action={updateUserCard} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={card.id} />
          <input type="hidden" name="album_id" value={card.album_id ?? ""} />
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
          <input name="condition" defaultValue={card.condition ?? ""} placeholder="Condicao" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="quantity" type="number" min="1" defaultValue={card.quantity} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="paid_price" type="number" step="0.01" min="0" defaultValue={card.paid_price ?? 0} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="user_value" type="number" step="0.01" min="0" defaultValue={card.user_value ?? 0} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <textarea name="notes" defaultValue={card.notes ?? ""} placeholder="Observacoes" className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <Save className="size-4" />
            Salvar
          </button>
        </form>
        <form action={removeUserCard} className="mt-3">
          <input type="hidden" name="id" value={card.id} />
          <input type="hidden" name="album_id" value={card.album_id ?? ""} />
          <button className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
            <Trash2 className="size-4" />
            Remover carta
          </button>
        </form>
      </details>
    </article>
  );
}
