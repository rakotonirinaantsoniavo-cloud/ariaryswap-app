-- ============================================================
-- AriarySwap — schéma Supabase (à exécuter dans SQL Editor)
-- ============================================================

-- 1. Extension nécessaire pour uuid
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. PROFILS (étend auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  first_names text,
  birth_date date,
  address text,
  role text not null default 'client' check (role in ('client','admin')),
  kyc_status text not null default 'pending' check (kyc_status in ('pending','submitted','approved','rejected')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Un utilisateur voit son propre profil"
  on public.profiles for select
  using (auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Un utilisateur modifie son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Un utilisateur crée son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Admin peut tout modifier (statut KYC etc.)
create policy "Admin modifie tous les profils"
  on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Fonction : créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. WALLETS CRYPTO (client)
-- ============================================================
create table public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,          -- ex: "Trust Wallet", "Binance"
  network text not null,        -- ex: TRC20, BEP20, ERC20
  scan_image_url text not null, -- image du QR/adresse dans Supabase Storage
  created_at timestamptz default now()
);

alter table public.wallets enable row level security;

create policy "Client voit ses propres wallets"
  on public.wallets for select using (auth.uid() = user_id);
create policy "Client ajoute ses propres wallets"
  on public.wallets for insert with check (auth.uid() = user_id);
create policy "Client supprime ses propres wallets"
  on public.wallets for delete using (auth.uid() = user_id);
create policy "Admin voit tous les wallets"
  on public.wallets for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- 4. OPÉRATEURS MOBILES (client)
-- ============================================================
create table public.phone_operators (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  operator text not null check (operator in ('Airtel','Orange','Yas')),
  phone_number text not null,
  created_at timestamptz default now()
);

alter table public.phone_operators enable row level security;

create policy "Client gère ses numéros"
  on public.phone_operators for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admin voit tous les numéros"
  on public.phone_operators for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- 5. TAUX DE CHANGE (défini par l'admin)
-- ============================================================
create table public.exchange_rates (
  id uuid primary key default uuid_generate_v4(),
  pair text not null unique,     -- ex: 'USDT/MGA'
  rate numeric not null,         -- 1 unité crypto = X Ariary
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

alter table public.exchange_rates enable row level security;

create policy "Tout le monde peut lire les taux"
  on public.exchange_rates for select using (true);
create policy "Seul l'admin modifie les taux"
  on public.exchange_rates for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Seul l'admin met à jour les taux"
  on public.exchange_rates for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- 6. ORDRES (achat / vente)
-- ============================================================
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('buy','sell')),
  pair text not null,               -- ex: 'USDT/MGA'
  crypto_amount numeric not null,
  ariary_amount numeric not null,
  rate_applied numeric not null,
  wallet_id uuid references public.wallets(id),        -- adresse crypto du client
  phone_operator_id uuid references public.phone_operators(id), -- numéro du client
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Client voit ses propres ordres"
  on public.orders for select using (auth.uid() = user_id);
create policy "Client crée ses propres ordres"
  on public.orders for insert with check (auth.uid() = user_id);
create policy "Admin voit tous les ordres"
  on public.orders for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Admin met à jour tous les ordres"
  on public.orders for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade, -- null = notif globale (mise à jour app)
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Utilisateur voit ses notifs + notifs globales"
  on public.notifications for select using (user_id = auth.uid() or user_id is null);
create policy "Admin crée des notifications"
  on public.notifications for insert with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "Utilisateur marque ses notifs comme lues"
  on public.notifications for update using (user_id = auth.uid());

-- ============================================================
-- 8. Taux initiaux (exemple)
-- ============================================================
insert into public.exchange_rates (pair, rate) values
  ('USDT/MGA', 4100),
  ('BTC/MGA', 264500000),
  ('ETH/MGA', 9870000),
  ('BNB/MGA', 2340000)
on conflict (pair) do nothing;

-- ============================================================
-- 9. Storage buckets (à créer aussi depuis l'onglet Storage)
-- Buckets nécessaires : 'kyc-documents' (privé), 'wallet-scans' (privé)
-- Politique recommandée : accès en lecture/écriture limité au propriétaire (owner = auth.uid())
-- et lecture supplémentaire pour le rôle admin, à définir depuis l'UI Storage > Policies.
-- ============================================================
