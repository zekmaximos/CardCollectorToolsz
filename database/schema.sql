create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  album_id uuid references public.albums(id) on delete cascade,
  external_card_id text not null,
  name text not null,
  set_name text,
  card_number text,
  rarity text,
  language text,
  image_url text,
  market_price numeric,
  market_currency text,
  market_source text,
  user_value numeric,
  paid_price numeric,
  condition text,
  quantity integer default 1 check (quantity > 0),
  notes text,
  acquired_at date,
  created_at timestamptz default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expense_date date not null,
  category text not null check (category in ('booster', 'box', 'carta_avulsa', 'acessorio', 'outro')),
  item_name text not null,
  amount numeric not null check (amount >= 0),
  quantity integer default 1 check (quantity > 0),
  unit_amount numeric,
  has_hit boolean default false,
  hit_type text,
  hit_notes text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.price_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_card_id uuid not null references public.user_cards(id) on delete cascade,
  source text,
  currency text,
  market_price numeric,
  captured_at timestamptz default now()
);

create table if not exists public.pokemon_tcg_pull_rates (
  id uuid primary key default gen_random_uuid(),
  set_name text not null,
  set_slug text not null,
  rarity_name text not null,
  rarity_slug text not null,
  rarity_group text not null,
  odds_one_in numeric not null check (odds_one_in > 0),
  is_major_hit boolean default false,
  is_premium_hit boolean default false,
  source_note text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (set_slug, rarity_slug)
);

create index if not exists albums_user_id_idx on public.albums(user_id);
create index if not exists user_cards_user_id_idx on public.user_cards(user_id);
create index if not exists user_cards_album_id_idx on public.user_cards(album_id);
create index if not exists expenses_user_id_date_idx on public.expenses(user_id, expense_date);
create index if not exists price_snapshots_user_card_id_idx on public.price_snapshots(user_card_id);
create index if not exists pokemon_tcg_pull_rates_active_set_idx on public.pokemon_tcg_pull_rates(is_active, set_slug);

alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.user_cards enable row level security;
alter table public.expenses enable row level security;
alter table public.price_snapshots enable row level security;
alter table public.pokemon_tcg_pull_rates enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles for delete
to authenticated
using (auth.uid() = id);

drop policy if exists "albums_select_own" on public.albums;
create policy "albums_select_own"
on public.albums for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "albums_insert_own" on public.albums;
create policy "albums_insert_own"
on public.albums for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "albums_update_own" on public.albums;
create policy "albums_update_own"
on public.albums for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "albums_delete_own" on public.albums;
create policy "albums_delete_own"
on public.albums for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_cards_select_own" on public.user_cards;
create policy "user_cards_select_own"
on public.user_cards for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_cards_insert_own" on public.user_cards;
create policy "user_cards_insert_own"
on public.user_cards for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    album_id is null
    or exists (
      select 1 from public.albums
      where albums.id = user_cards.album_id
      and albums.user_id = auth.uid()
    )
  )
);

drop policy if exists "user_cards_update_own" on public.user_cards;
create policy "user_cards_update_own"
on public.user_cards for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    album_id is null
    or exists (
      select 1 from public.albums
      where albums.id = user_cards.album_id
      and albums.user_id = auth.uid()
    )
  )
);

drop policy if exists "user_cards_delete_own" on public.user_cards;
create policy "user_cards_delete_own"
on public.user_cards for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
on public.expenses for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
on public.expenses for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own"
on public.expenses for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
on public.expenses for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "price_snapshots_select_own_cards" on public.price_snapshots;
create policy "price_snapshots_select_own_cards"
on public.price_snapshots for select
to authenticated
using (
  exists (
    select 1 from public.user_cards
    where user_cards.id = price_snapshots.user_card_id
    and user_cards.user_id = auth.uid()
  )
);

drop policy if exists "price_snapshots_insert_own_cards" on public.price_snapshots;
create policy "price_snapshots_insert_own_cards"
on public.price_snapshots for insert
to authenticated
with check (
  exists (
    select 1 from public.user_cards
    where user_cards.id = price_snapshots.user_card_id
    and user_cards.user_id = auth.uid()
  )
);

drop policy if exists "price_snapshots_update_own_cards" on public.price_snapshots;
create policy "price_snapshots_update_own_cards"
on public.price_snapshots for update
to authenticated
using (
  exists (
    select 1 from public.user_cards
    where user_cards.id = price_snapshots.user_card_id
    and user_cards.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.user_cards
    where user_cards.id = price_snapshots.user_card_id
    and user_cards.user_id = auth.uid()
  )
);

drop policy if exists "price_snapshots_delete_own_cards" on public.price_snapshots;
create policy "price_snapshots_delete_own_cards"
on public.price_snapshots for delete
to authenticated
using (
  exists (
    select 1 from public.user_cards
    where user_cards.id = price_snapshots.user_card_id
    and user_cards.user_id = auth.uid()
  )
);

drop policy if exists "pokemon_tcg_pull_rates_select_active" on public.pokemon_tcg_pull_rates;
create policy "pokemon_tcg_pull_rates_select_active"
on public.pokemon_tcg_pull_rates for select
to authenticated
using (is_active = true);

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.albums to authenticated;
grant select, insert, update, delete on public.user_cards to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.price_snapshots to authenticated;
grant select on public.pokemon_tcg_pull_rates to authenticated;

insert into public.pokemon_tcg_pull_rates
  (set_name, set_slug, rarity_name, rarity_slug, rarity_group, odds_one_in, is_major_hit, is_premium_hit, source_note)
values
  ('Fogo Fantasmagorico', 'fogo-fantasmagorico', 'Double Rare / ex', 'double_rare_ex', 'double_rare_ex', 5, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Fogo Fantasmagorico', 'fogo-fantasmagorico', 'Ultra Rare', 'ultra_rare', 'ultra_rare', 12, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Fogo Fantasmagorico', 'fogo-fantasmagorico', 'Illustration Rare', 'illustration_rare', 'illustration_rare', 9, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Fogo Fantasmagorico', 'fogo-fantasmagorico', 'SIR/SAR', 'sir_sar', 'sir_sar', 80, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Fogo Fantasmagorico', 'fogo-fantasmagorico', 'Mega Hyper Rare', 'mega_hyper_rare', 'mega_hyper_rare', 1260, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Equilibrio Perfeito', 'equilibrio-perfeito', 'Double Rare / ex', 'double_rare_ex', 'double_rare_ex', 5, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Equilibrio Perfeito', 'equilibrio-perfeito', 'Ultra Rare', 'ultra_rare', 'ultra_rare', 12, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Equilibrio Perfeito', 'equilibrio-perfeito', 'Illustration Rare', 'illustration_rare', 'illustration_rare', 9, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Equilibrio Perfeito', 'equilibrio-perfeito', 'SIR/SAR', 'sir_sar', 'sir_sar', 81, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Equilibrio Perfeito', 'equilibrio-perfeito', 'Mega Hyper Rare', 'mega_hyper_rare', 'mega_hyper_rare', 1786, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Amigos da Jornada', 'amigos-da-jornada', 'Double Rare / ex', 'double_rare_ex', 'double_rare_ex', 5, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Amigos da Jornada', 'amigos-da-jornada', 'Ultra Rare', 'ultra_rare', 'ultra_rare', 15, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Amigos da Jornada', 'amigos-da-jornada', 'Illustration Rare', 'illustration_rare', 'illustration_rare', 12, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Amigos da Jornada', 'amigos-da-jornada', 'SIR/SAR', 'sir_sar', 'sir_sar', 86, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Amigos da Jornada', 'amigos-da-jornada', 'Hyper Rare', 'hyper_rare', 'hyper_rare', 137, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Rivais Predestinados', 'rivais-predestinados', 'Double Rare / ex', 'double_rare_ex', 'double_rare_ex', 5, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Rivais Predestinados', 'rivais-predestinados', 'Ultra Rare', 'ultra_rare', 'ultra_rare', 16, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Rivais Predestinados', 'rivais-predestinados', 'Illustration Rare', 'illustration_rare', 'illustration_rare', 12, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Rivais Predestinados', 'rivais-predestinados', 'SIR/SAR', 'sir_sar', 'sir_sar', 94, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Rivais Predestinados', 'rivais-predestinados', 'Hyper Rare', 'hyper_rare', 'hyper_rare', 149, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Herois Excelsos', 'herois-excelsos', 'Double Rare / ex', 'double_rare_ex', 'double_rare_ex', 5, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Herois Excelsos', 'herois-excelsos', 'Ultra Rare', 'ultra_rare', 'ultra_rare', 21, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Herois Excelsos', 'herois-excelsos', 'Illustration Rare', 'illustration_rare', 'illustration_rare', 9, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Herois Excelsos', 'herois-excelsos', 'SIR/SAR', 'sir_sar', 'sir_sar', 70, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Herois Excelsos', 'herois-excelsos', 'Mega Hyper Rare', 'mega_hyper_rare', 'mega_hyper_rare', 540, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Mega Evolucao', 'mega-evolucao', 'Double Rare / ex', 'double_rare_ex', 'double_rare_ex', 5, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Mega Evolucao', 'mega-evolucao', 'Ultra Rare', 'ultra_rare', 'ultra_rare', 12, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Mega Evolucao', 'mega-evolucao', 'Illustration Rare', 'illustration_rare', 'illustration_rare', 9, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Mega Evolucao', 'mega-evolucao', 'SIR/SAR', 'sir_sar', 'sir_sar', 101, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Mega Evolucao', 'mega-evolucao', 'Mega Hyper Rare', 'mega_hyper_rare', 'mega_hyper_rare', 1260, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Raio Preto / Fogo Branco', 'raio-preto-fogo-branco', 'Double Rare / ex', 'double_rare_ex', 'double_rare_ex', 4.7, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Raio Preto / Fogo Branco', 'raio-preto-fogo-branco', 'Ultra Rare', 'ultra_rare', 'ultra_rare', 17.2, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Raio Preto / Fogo Branco', 'raio-preto-fogo-branco', 'Illustration Rare', 'illustration_rare', 'illustration_rare', 6.1, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Raio Preto / Fogo Branco', 'raio-preto-fogo-branco', 'SIR/SAR', 'sir_sar', 'sir_sar', 80, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Raio Preto / Fogo Branco', 'raio-preto-fogo-branco', 'Black White Rare', 'black_white_rare', 'black_white_rare', 496, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Evolucoes Prismaticas', 'evolucoes-prismaticas', 'Double Rare / ex', 'double_rare_ex', 'double_rare_ex', 6.1, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Evolucoes Prismaticas', 'evolucoes-prismaticas', 'Ultra Rare', 'ultra_rare', 'ultra_rare', 13.4, true, false, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Evolucoes Prismaticas', 'evolucoes-prismaticas', 'SIR/SAR', 'sir_sar', 'sir_sar', 45, true, true, 'Estimativa baseada em dados publicos/comunitarios.'),
  ('Evolucoes Prismaticas', 'evolucoes-prismaticas', 'Hyper Rare', 'hyper_rare', 'hyper_rare', 178.6, true, true, 'Estimativa baseada em dados publicos/comunitarios.')
on conflict (set_slug, rarity_slug) do update set
  set_name = excluded.set_name,
  rarity_name = excluded.rarity_name,
  rarity_group = excluded.rarity_group,
  odds_one_in = excluded.odds_one_in,
  is_major_hit = excluded.is_major_hit,
  is_premium_hit = excluded.is_premium_hit,
  source_note = excluded.source_note,
  is_active = true,
  updated_at = now();
