-- =============================================================================
-- Spoilering — Schema completo de Supabase
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensiones
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------
create type user_role      as enum ('user', 'editor', 'admin');
create type work_type      as enum ('movie', 'series', 'book');
create type card_status    as enum ('draft', 'published', 'locked');
create type revision_status as enum ('pending', 'approved', 'rejected', 'superseded');

-- ---------------------------------------------------------------------------
-- Función auxiliar: actualizar updated_at automáticamente
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABLA: profiles
-- =============================================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  avatar_url  text,
  bio         text,
  reputation  integer not null default 0,
  role        user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_profiles_username on profiles (username);
create index idx_profiles_role     on profiles (role);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Crear perfil automáticamente al registrar un usuario
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================================
-- TABLA: works
-- =============================================================================
create table works (
  id              uuid primary key default uuid_generate_v4(),
  type            work_type not null,
  title           text not null,
  original_title  text,
  year            integer,
  poster_url      text,
  tmdb_id         integer unique,
  google_books_id text unique,
  genres          text[] not null default '{}',
  authors         text[] not null default '{}',
  directors       text[] not null default '{}',
  seasons_count   integer,
  overview        text,
  slug            text not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint works_year_check check (year is null or (year >= 1800 and year <= 2200)),
  constraint works_slug_format check (slug ~ '^[a-z0-9-]+$')
);

create index idx_works_type         on works (type);
create index idx_works_slug         on works (slug);
create index idx_works_tmdb_id      on works (tmdb_id) where tmdb_id is not null;
create index idx_works_google_books on works (google_books_id) where google_books_id is not null;
create index idx_works_year         on works (year) where year is not null;
create index idx_works_title_trgm   on works using gin (title gin_trgm_ops);

create trigger trg_works_updated_at
  before update on works
  for each row execute function set_updated_at();

-- =============================================================================
-- TABLA: cards
-- =============================================================================
create table cards (
  id          uuid primary key default uuid_generate_v4(),
  work_id     uuid not null references works(id) on delete cascade,
  status      card_status not null default 'draft',
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint cards_one_per_work unique (work_id)
);

create index idx_cards_work_id    on cards (work_id);
create index idx_cards_status     on cards (status);
create index idx_cards_created_by on cards (created_by) where created_by is not null;
create index idx_cards_updated_at on cards (updated_at desc);

create trigger trg_cards_updated_at
  before update on cards
  for each row execute function set_updated_at();

-- =============================================================================
-- TABLA: sections
-- =============================================================================
create table sections (
  id              uuid primary key default uuid_generate_v4(),
  card_id         uuid not null references cards(id) on delete cascade,
  parent_id       uuid references sections(id) on delete cascade,
  order_index     integer not null default 0,
  label           text not null,
  short_label     text,
  content         text not null default '',
  content_warning text,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint sections_no_self_parent check (id <> parent_id)
);

create index idx_sections_card_id   on sections (card_id);
create index idx_sections_parent_id on sections (parent_id) where parent_id is not null;
create index idx_sections_order     on sections (card_id, parent_id, order_index);

create trigger trg_sections_updated_at
  before update on sections
  for each row execute function set_updated_at();

-- =============================================================================
-- TABLA: revisions
-- =============================================================================
create table revisions (
  id             uuid primary key default uuid_generate_v4(),
  section_id     uuid not null references sections(id) on delete cascade,
  proposed_by    uuid not null references profiles(id) on delete cascade,
  content_before text not null,
  content_after  text not null,
  summary        text,
  status         revision_status not null default 'pending',
  votes_up       integer not null default 0,
  votes_down     integer not null default 0,
  resolved_by    uuid references profiles(id) on delete set null,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),

  constraint revisions_content_differs check (content_before <> content_after)
);

create index idx_revisions_section_id  on revisions (section_id);
create index idx_revisions_proposed_by on revisions (proposed_by);
create index idx_revisions_status      on revisions (status);
create index idx_revisions_created_at  on revisions (created_at desc);

-- =============================================================================
-- TABLA: revision_votes
-- =============================================================================
create table revision_votes (
  id          uuid primary key default uuid_generate_v4(),
  revision_id uuid not null references revisions(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  vote        boolean not null,
  created_at  timestamptz not null default now(),

  constraint revision_votes_unique unique (revision_id, user_id)
);

create index idx_revision_votes_revision on revision_votes (revision_id);
create index idx_revision_votes_user     on revision_votes (user_id);

-- Actualizar contadores de votos en revisions automáticamente
create or replace function sync_revision_vote_counts()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    update revisions set
      votes_up   = (select count(*) from revision_votes where revision_id = old.revision_id and vote = true),
      votes_down = (select count(*) from revision_votes where revision_id = old.revision_id and vote = false)
    where id = old.revision_id;
    return old;
  else
    update revisions set
      votes_up   = (select count(*) from revision_votes where revision_id = new.revision_id and vote = true),
      votes_down = (select count(*) from revision_votes where revision_id = new.revision_id and vote = false)
    where id = new.revision_id;
    return new;
  end if;
end;
$$;

create trigger trg_revision_votes_sync
  after insert or update or delete on revision_votes
  for each row execute function sync_revision_vote_counts();

-- =============================================================================
-- TABLA: ai_generations
-- =============================================================================
create table ai_generations (
  id            uuid primary key default uuid_generate_v4(),
  card_id       uuid references cards(id) on delete set null,
  work_id       uuid references works(id) on delete set null,
  generated_by  uuid references profiles(id) on delete set null,
  model         text not null,
  prompt        text not null,
  response      jsonb not null,
  tokens_input  integer,
  tokens_output integer,
  duration_ms   integer,
  created_at    timestamptz not null default now()
);

create index idx_ai_generations_card_id      on ai_generations (card_id) where card_id is not null;
create index idx_ai_generations_work_id      on ai_generations (work_id) where work_id is not null;
create index idx_ai_generations_generated_by on ai_generations (generated_by) where generated_by is not null;
create index idx_ai_generations_created_at   on ai_generations (created_at desc);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table profiles       enable row level security;
alter table works           enable row level security;
alter table cards           enable row level security;
alter table sections        enable row level security;
alter table revisions       enable row level security;
alter table revision_votes  enable row level security;
alter table ai_generations  enable row level security;

-- ---------------------------------------------------------------------------
-- Función auxiliar: obtener rol del usuario actual
-- ---------------------------------------------------------------------------
create or replace function current_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "Perfiles visibles por todos"
  on profiles for select using (true);

create policy "Usuario edita su propio perfil"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy "Admin gestiona perfiles"
  on profiles for all
  using (current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- works
-- ---------------------------------------------------------------------------
create policy "Works visibles por todos"
  on works for select using (true);

create policy "Editors y admins crean works"
  on works for insert
  with check (current_user_role() in ('editor', 'admin'));

create policy "Editors y admins editan works"
  on works for update
  using (current_user_role() in ('editor', 'admin'));

create policy "Solo admins eliminan works"
  on works for delete
  using (current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- cards
-- ---------------------------------------------------------------------------
create policy "Cards publicadas visibles por todos"
  on cards for select
  using (status = 'published' or auth.uid() is not null);

create policy "Usuarios autenticados crean cards"
  on cards for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "Editors y admins actualizan cards"
  on cards for update
  using (current_user_role() in ('editor', 'admin') or created_by = auth.uid());

create policy "Solo admins eliminan cards"
  on cards for delete
  using (current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- sections
-- ---------------------------------------------------------------------------
-- Política para usuarios autenticados (editors/admins ven todo)
create policy "Secciones publicadas visibles por todos"
  on sections for select
  using (
    is_published = true
    or auth.uid() is not null
  );

-- Política adicional para usuarios anónimos: ver secciones de fichas publicadas
-- EJECUTAR en Supabase si los usuarios anónimos no pueden ver el contenido:
-- create policy "Secciones de fichas publicadas visibles para anon"
--   on sections for select
--   to anon
--   using (
--     exists (
--       select 1 from cards
--       where cards.id = sections.card_id
--       and cards.status = 'published'
--     )
--   );

create policy "Editors y admins gestionan secciones"
  on sections for insert
  with check (current_user_role() in ('editor', 'admin'));

create policy "Editors y admins actualizan secciones"
  on sections for update
  using (current_user_role() in ('editor', 'admin'));

create policy "Solo admins eliminan secciones"
  on sections for delete
  using (current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- revisions
-- ---------------------------------------------------------------------------
create policy "Revisiones visibles por usuarios autenticados"
  on revisions for select
  using (auth.uid() is not null);

create policy "Usuarios autenticados proponen revisiones"
  on revisions for insert
  with check (auth.uid() is not null and proposed_by = auth.uid());

create policy "Solo editors y admins resuelven revisiones"
  on revisions for update
  using (current_user_role() in ('editor', 'admin'));

create policy "Solo admins eliminan revisiones"
  on revisions for delete
  using (current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- revision_votes
-- ---------------------------------------------------------------------------
create policy "Votos visibles por usuarios autenticados"
  on revision_votes for select
  using (auth.uid() is not null);

create policy "Usuarios autenticados votan"
  on revision_votes for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "Usuario elimina su propio voto"
  on revision_votes for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------------
create policy "Solo editors y admins ven generaciones"
  on ai_generations for select
  using (current_user_role() in ('editor', 'admin'));

create policy "Solo editors y admins crean generaciones"
  on ai_generations for insert
  with check (current_user_role() in ('editor', 'admin') and generated_by = auth.uid());

create policy "Solo admins eliminan generaciones"
  on ai_generations for delete
  using (current_user_role() = 'admin');
