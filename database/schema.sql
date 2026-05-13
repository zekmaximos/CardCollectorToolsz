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

create index if not exists albums_user_id_idx on public.albums(user_id);
create index if not exists user_cards_user_id_idx on public.user_cards(user_id);
create index if not exists user_cards_album_id_idx on public.user_cards(album_id);
create index if not exists expenses_user_id_date_idx on public.expenses(user_id, expense_date);
create index if not exists price_snapshots_user_card_id_idx on public.price_snapshots(user_card_id);

alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.user_cards enable row level security;
alter table public.expenses enable row level security;
alter table public.price_snapshots enable row level security;

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
