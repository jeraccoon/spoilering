-- ────────────────────────────────────────────────────────────────────
-- Migración Fase 2 — Traducción de fichas con IA bajo demanda
-- ────────────────────────────────────────────────────────────────────
-- Ejecutar en Supabase SQL editor.
-- Idempotente: usa IF NOT EXISTS / DO NOTHING en todas partes.
-- ────────────────────────────────────────────────────────────────────

-- 1. Locale original de cada ficha (en qué idioma se escribió).
--    Las fichas existentes se asumen escritas en castellano.
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS original_locale text NOT NULL DEFAULT 'es';

-- 2. Traducciones de título y sinopsis a nivel de obra.
--    JSONB { "es": "Título", "en": "Title", ... }.
--    Se rellenan al crear obra desde TMDb (con ?language=) y/o por Claude.
ALTER TABLE works
  ADD COLUMN IF NOT EXISTS title_translations jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE works
  ADD COLUMN IF NOT EXISTS overview_translations jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3. Tabla de traducciones a nivel de sección (markdown grande).
--    UNIQUE (section_id, locale) garantiza un cache por idioma.
CREATE TABLE IF NOT EXISTS section_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text,
  short_label text,
  content text,
  source text NOT NULL DEFAULT 'ai', -- 'ai' | 'manual' | 'tmdb'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_section_translations_section_locale
  ON section_translations (section_id, locale);

-- 4. Tabla de traducciones a nivel de ficha (campo summary corto).
--    UNIQUE (card_id, locale).
CREATE TABLE IF NOT EXISTS card_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  locale text NOT NULL,
  summary text,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (card_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_card_translations_card_locale
  ON card_translations (card_id, locale);

-- 5. Trigger: actualizar updated_at en cada UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS section_translations_set_updated_at ON section_translations;
CREATE TRIGGER section_translations_set_updated_at
  BEFORE UPDATE ON section_translations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS card_translations_set_updated_at ON card_translations;
CREATE TRIGGER card_translations_set_updated_at
  BEFORE UPDATE ON card_translations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. RLS: lectura pública (las traducciones son contenido público igual
--    que las fichas). Escritura solo desde service_role (servidor).
ALTER TABLE section_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "section_translations_public_read" ON section_translations;
CREATE POLICY "section_translations_public_read"
  ON section_translations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "card_translations_public_read" ON card_translations;
CREATE POLICY "card_translations_public_read"
  ON card_translations FOR SELECT
  USING (true);

-- ────────────────────────────────────────────────────────────────────
-- Listo. Tras esto:
--   • cards.original_locale existe (default 'es').
--   • works tiene title_translations y overview_translations (jsonb).
--   • section_translations y card_translations existen, con RLS.
--   • Las fichas existentes siguen funcionando: el front detecta
--     que original_locale === target_locale y devuelve el original.
-- ────────────────────────────────────────────────────────────────────
