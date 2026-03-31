-- ================================================================
-- BusinessHub — Mise à jour schéma v2
-- À exécuter dans Supabase > SQL Editor après schema.sql
-- Remplace la table "rentals" par un modèle à deux niveaux
-- ================================================================

-- Supprimer l'ancienne table si elle existe
drop table if exists rentals;

-- Actifs locatifs (véhicule, appartement, équipement…)
create table if not exists rental_assets (
  id           text primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  biz_id       text references businesses(id),
  name         text not null,
  monthly_cost numeric default 0,
  notes        text,
  deleted_at   timestamptz,
  created_at   timestamptz default now()
);

-- Réservations individuelles liées à un actif
create table if not exists rental_bookings (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  asset_id    text references rental_assets(id) on delete cascade,
  sell_price  numeric default 0,
  start_date  date not null,
  end_date    date,
  status      text default 'confirmee',
  notes       text,
  deleted_at  timestamptz,
  created_at  timestamptz default now()
);

-- RLS
alter table rental_assets   enable row level security;
alter table rental_bookings enable row level security;
create policy "own" on rental_assets   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on rental_bookings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
