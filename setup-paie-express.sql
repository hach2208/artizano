-- ============================================================
-- PAIEEXPRESS - Script de configuration Supabase
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. TABLE ENTREPRISES
create table if not exists entreprises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nom text not null,
  siret text,
  adresse text,
  cp text,
  ville text,
  ape text,
  taux_at numeric default 2.21,
  created_at timestamptz default now()
);

-- 2. TABLE SALARIES
create table if not exists salaries (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references entreprises(id) on delete cascade not null,
  prenom text,
  nom text,
  num_ss text,
  adresse text,
  cp text,
  ville text,
  date_entree date,
  emploi text,
  statut text default 'non-cadre',
  heures numeric default 151.67,
  salaire_brut numeric,
  taux_pas numeric default 0,
  actif boolean default true,
  created_at timestamptz default now()
);

-- 3. TABLE BULLETINS
create table if not exists bulletins (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references entreprises(id) on delete cascade not null,
  salarie_id uuid references salaries(id) on delete cascade not null,
  mois int not null,
  annee int not null,
  brut_total numeric,
  cotisations jsonb,
  total_cotisations_sal numeric,
  total_cotisations_pat numeric,
  net_avant_impot numeric,
  net_imposable numeric,
  taux_pas numeric,
  montant_pas numeric,
  net_a_payer numeric,
  cout_employeur numeric,
  paye boolean default false,
  created_at timestamptz default now()
);

-- 4. TABLE PAIEMENTS
create table if not exists paiements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  montant numeric,
  statut text default 'pending',
  stripe_session_id text,
  items jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table entreprises enable row level security;
alter table salaries enable row level security;
alter table bulletins enable row level security;
alter table paiements enable row level security;

-- Policies entreprises
drop policy if exists "entreprises_user" on entreprises;
create policy "entreprises_user" on entreprises
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policies salaries (via entreprise)
drop policy if exists "salaries_user" on salaries;
create policy "salaries_user" on salaries
  using (entreprise_id in (select id from entreprises where user_id = auth.uid()))
  with check (entreprise_id in (select id from entreprises where user_id = auth.uid()));

-- Policies bulletins (via entreprise)
drop policy if exists "bulletins_user" on bulletins;
create policy "bulletins_user" on bulletins
  using (entreprise_id in (select id from entreprises where user_id = auth.uid()))
  with check (entreprise_id in (select id from entreprises where user_id = auth.uid()));

-- Policies paiements
drop policy if exists "paiements_user" on paiements;
create policy "paiements_user" on paiements
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
