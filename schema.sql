-- ================================================================
-- BusinessHub — Schéma Supabase complet
-- Collez ce fichier dans SQL Editor > New Query > Run
-- ================================================================

-- Activités
create table if not exists businesses (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#4f46e5',
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Produits
create table if not exists products (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  biz_id text references businesses(id),
  name text not null,
  category text not null default 'physical',
  buy_price numeric default 0,
  sell_price numeric default 0,
  stock integer default 0,
  unit text default 'unité(s)',
  description text,
  image text,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Ventes
create table if not exists sales (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  biz_id text references businesses(id),
  product_id text,
  name text not null,
  qty integer default 1,
  sell_price numeric default 0,
  cost_price numeric default 0,
  sale_date date not null,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Locations
create table if not exists rentals (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  biz_id text references businesses(id),
  name text not null,
  cost_price numeric default 0,
  sell_price numeric default 0,
  start_date date,
  end_date date,
  status text default 'disponible',
  notes text,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Partenaires
create table if not exists partners (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Lien ventes ↔ partenaires
create table if not exists sale_partners (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  sale_id text references sales(id) on delete cascade,
  partner_id text references partners(id) on delete cascade,
  share_pct numeric default 50,
  amount_due numeric default 0,
  created_at timestamptz default now()
);

-- Paiements versés aux partenaires
create table if not exists partner_payments (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  partner_id text references partners(id) on delete cascade,
  amount numeric not null,
  payment_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Abonnements / Charges récurrentes
create table if not exists subscriptions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  biz_id text,
  name text not null,
  amount numeric default 0,
  cycle text default 'monthly',
  next_billing_date date,
  active boolean default true,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- ================================================================
-- RLS (Row Level Security) — chaque user voit uniquement ses données
-- ================================================================
alter table businesses enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table rentals enable row level security;
alter table partners enable row level security;
alter table sale_partners enable row level security;
alter table partner_payments enable row level security;
alter table subscriptions enable row level security;

create policy "own" on businesses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on sales for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on rentals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on partners for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on sale_partners for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on partner_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own" on subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ================================================================
-- Storage bucket pour les images produit (optionnel)
-- Exécutez dans Storage > New bucket : "product-images" (public)
-- ================================================================
