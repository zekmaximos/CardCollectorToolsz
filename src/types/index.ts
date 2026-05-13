export type PokemonCardApiResult = {
  id: string;
  name: string;
  language?: string | null;
  source?: "pokemontcg" | "tcgdex";
  number?: string | null;
  rarity?: string | null;
  marketPrice?: {
    amount: number;
    currency: string;
    source: string;
  } | null;
  images?: {
    small?: string;
    large?: string;
  } | null;
  set?: {
    id?: string;
    name?: string;
    series?: string;
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

export type Album = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type UserCard = {
  id: string;
  user_id: string;
  album_id: string | null;
  external_card_id: string;
  name: string;
  set_name: string | null;
  card_number: string | null;
  rarity: string | null;
  language: string | null;
  image_url: string | null;
  market_price: number | null;
  market_currency: string | null;
  market_source: string | null;
  user_value: number | null;
  paid_price: number | null;
  condition: string | null;
  quantity: number;
  notes: string | null;
  acquired_at: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  expense_date: string;
  category: "booster" | "box" | "carta_avulsa" | "acessorio" | "outro" | string;
  item_name: string;
  amount: number;
  notes: string | null;
  created_at: string;
};

export type DashboardStats = {
  total_cards: number;
  total_paid_cards: number;
  total_user_value: number;
  total_expenses: number;
  balance: number;
};
