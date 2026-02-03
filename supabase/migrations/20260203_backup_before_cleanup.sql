-- Backup user_ending_note table and user_favorites (if exists) into backup schema
-- Ensure backup schema exists
CREATE SCHEMA IF NOT EXISTS backup;

-- Backup tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_ending_note') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS backup.user_ending_note AS TABLE public.user_ending_note;';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_favorites') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS backup.user_favorites AS TABLE public.user_favorites;';
  END IF;
END$$;

-- Backup function definitions: upsert_ending_note and get_my_ending_note and auto funcs
-- We'll store function definitions in a backup table
CREATE TABLE IF NOT EXISTS backup.function_definitions (
  name text PRIMARY KEY,
  definition text,
  backed_up_at timestamptz default now()
);

-- Helper to insert function source if exists
DO $$
DECLARE
  rec record;
  func_name text;
  src text;
BEGIN
  FOR rec IN
    SELECT p.proname, p.oid 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN (
      'auto_create_favorite_journey_event',
      'auto_delete_favorite_journey_event',
      'upsert_ending_note',
      'get_my_ending_note'
    )
  LOOP
    func_name := rec.proname;
    SELECT pg_get_functiondef(rec.oid) INTO src;
    INSERT INTO backup.function_definitions (name, definition)
    VALUES (func_name, src)
    ON CONFLICT (name) DO UPDATE SET definition = EXCLUDED.definition, backed_up_at = now();
  END LOOP;
END$$;

-- Backup trigger definitions related to user_favorites
CREATE TABLE IF NOT EXISTS backup.trigger_definitions (
  name text PRIMARY KEY,
  table_name text,
  definition text,
  backed_up_at timestamptz default now()
);

DO $$
DECLARE
  trg record;
  def text;
BEGIN
  FOR trg IN
    SELECT tg.tgname, rel.relname AS table_name, pg_get_triggerdef(tg.oid) AS definition
    FROM pg_trigger tg
    JOIN pg_class rel ON tg.tgrelid = rel.oid
    JOIN pg_namespace ns ON rel.relnamespace = ns.oid
    WHERE ns.nspname = 'public' AND rel.relname = 'user_favorites' AND tg.tgname IN (
      'trigger_auto_journey_on_favorite',
      'trigger_auto_delete_journey_on_unfavorite'
    )
  LOOP
    INSERT INTO backup.trigger_definitions (name, table_name, definition)
    VALUES (trg.tgname, trg.table_name, trg.definition)
    ON CONFLICT (name) DO UPDATE SET definition = EXCLUDED.definition, backed_up_at = now();
  END LOOP;
END$$;

-- Validate backups exist
SELECT
  (SELECT count(*) FROM backup.user_ending_note) AS user_ending_note_rows_backup,
  (SELECT count(*) FROM backup.user_favorites) AS user_favorites_rows_backup,
  (SELECT count(*) FROM backup.function_definitions) AS functions_backed_up,
  (SELECT count(*) FROM backup.trigger_definitions) AS triggers_backed_up;
