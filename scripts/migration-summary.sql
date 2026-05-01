-- Migración: añade columna `summary` (resumen rápido / TL;DR) a la tabla cards.
-- Ejecutar UNA SOLA VEZ en el SQL editor de Supabase.
-- Idempotente: usa IF NOT EXISTS, se puede correr varias veces sin daño.

ALTER TABLE cards ADD COLUMN IF NOT EXISTS summary text;

-- Opcional: si quieres limitar la longitud (recomendado para que no se desvirtúe el TL;DR)
-- ALTER TABLE cards ADD CONSTRAINT cards_summary_length CHECK (summary IS NULL OR char_length(summary) <= 800);

COMMENT ON COLUMN cards.summary IS 'Resumen rápido (TL;DR) que se muestra arriba de la ficha pública dentro del aviso de spoilers. Editable por el creador y por editores/admins.';
