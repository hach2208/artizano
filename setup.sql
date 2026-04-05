-- ============================================================
-- ARTIZANO - Script de configuration complète de la base Supabase
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. TABLE PROFILES (enrichie)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  prenom text,
  nom text,
  role text check (role in ('particulier','artisan')) default 'particulier',
  telephone text,
  ville text,
  description text,
  experience int default 0,
  rayon int default 30,
  tarif_horaire numeric,
  siret text,
  specialites text[] default '{}',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ajouter les colonnes manquantes si la table existe déjà
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='telephone') then
    alter table profiles add column telephone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='ville') then
    alter table profiles add column ville text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='description') then
    alter table profiles add column description text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='experience') then
    alter table profiles add column experience int default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='rayon') then
    alter table profiles add column rayon int default 30;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='tarif_horaire') then
    alter table profiles add column tarif_horaire numeric;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='siret') then
    alter table profiles add column siret text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='specialites') then
    alter table profiles add column specialites text[] default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='avatar_url') then
    alter table profiles add column avatar_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='updated_at') then
    alter table profiles add column updated_at timestamptz default now();
  end if;
end$$;

-- 2. TABLE PROJETS
-- ============================================================
create table if not exists projets (
  id uuid primary key default gen_random_uuid(),
  particulier_id uuid references profiles(id) on delete cascade,
  titre text not null,
  description text,
  categorie text,
  localisation text,
  code_postal text,
  budget_min numeric,
  budget_max numeric,
  urgence text check (urgence in ('flexible','dans_1_mois','urgent')) default 'flexible',
  statut text check (statut in ('ouvert','en_cours','termine','annule')) default 'ouvert',
  nb_devis int default 0,
  created_at timestamptz default now()
);

-- Ajouter colonnes manquantes
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='projets' and column_name='nb_devis') then
    alter table projets add column nb_devis int default 0;
  end if;
end$$;

-- 3. TABLE CONVERSATIONS
-- ============================================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  particulier_id uuid references profiles(id) on delete cascade,
  artisan_id uuid references profiles(id) on delete cascade,
  projet_id uuid references projets(id) on delete set null,
  created_at timestamptz default now(),
  unique(artisan_id, projet_id)
);

-- 4. TABLE MESSAGES
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  contenu text not null,
  lu boolean default false,
  created_at timestamptz default now()
);

-- 5. TABLE AVIS
-- ============================================================
create table if not exists avis (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid references profiles(id) on delete cascade,
  auteur_id uuid references profiles(id) on delete set null,
  projet_id uuid references projets(id) on delete set null,
  note int check (note between 1 and 5) not null,
  commentaire text,
  created_at timestamptz default now()
);

-- ============================================================
-- TRIGGER : Créer un profil automatiquement à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, prenom, nom, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'prenom', ''),
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.raw_user_meta_data->>'role', 'particulier')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- PROFILES
alter table profiles enable row level security;
drop policy if exists "Profils visibles publiquement" on profiles;
create policy "Profils visibles publiquement" on profiles for select using (true);
drop policy if exists "L'utilisateur modifie son profil" on profiles;
create policy "L'utilisateur modifie son profil" on profiles for update using (auth.uid() = id);
drop policy if exists "L'utilisateur insère son profil" on profiles;
create policy "L'utilisateur insère son profil" on profiles for insert with check (auth.uid() = id);

-- PROJETS
alter table projets enable row level security;
drop policy if exists "Projets ouverts visibles" on projets;
create policy "Projets ouverts visibles" on projets for select using (true);
drop policy if exists "Le particulier crée ses projets" on projets;
create policy "Le particulier crée ses projets" on projets for insert with check (auth.uid() = particulier_id);
drop policy if exists "Le particulier modifie ses projets" on projets;
create policy "Le particulier modifie ses projets" on projets for update using (auth.uid() = particulier_id);

-- CONVERSATIONS
alter table conversations enable row level security;
drop policy if exists "Voir ses conversations" on conversations;
create policy "Voir ses conversations" on conversations for select using (auth.uid() = particulier_id or auth.uid() = artisan_id);
drop policy if exists "Créer une conversation" on conversations;
create policy "Créer une conversation" on conversations for insert with check (auth.uid() = artisan_id or auth.uid() = particulier_id);

-- MESSAGES
alter table messages enable row level security;
drop policy if exists "Voir messages de ses conversations" on messages;
create policy "Voir messages de ses conversations" on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and (c.particulier_id = auth.uid() or c.artisan_id = auth.uid()))
);
drop policy if exists "Envoyer un message dans ses conversations" on messages;
create policy "Envoyer un message dans ses conversations" on messages for insert with check (
  auth.uid() = sender_id and
  exists (select 1 from conversations c where c.id = conversation_id and (c.particulier_id = auth.uid() or c.artisan_id = auth.uid()))
);

-- AVIS
alter table avis enable row level security;
drop policy if exists "Avis visibles publiquement" on avis;
create policy "Avis visibles publiquement" on avis for select using (true);
drop policy if exists "L'auteur crée un avis" on avis;
create policy "L'auteur crée un avis" on avis for insert with check (auth.uid() = auteur_id);

-- ============================================================
-- REALTIME : Activer pour les messages
-- ============================================================
alter publication supabase_realtime add table messages;

-- ============================================================
-- INDEX pour les performances
-- ============================================================
create index if not exists idx_projets_particulier on projets(particulier_id);
create index if not exists idx_projets_statut on projets(statut);
create index if not exists idx_projets_categorie on projets(categorie);
create index if not exists idx_conversations_artisan on conversations(artisan_id);
create index if not exists idx_conversations_particulier on conversations(particulier_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_messages_created on messages(created_at);
create index if not exists idx_avis_artisan on avis(artisan_id);
