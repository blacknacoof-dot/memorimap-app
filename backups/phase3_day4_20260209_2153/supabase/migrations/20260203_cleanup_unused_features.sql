-- Cleanup Unused Features (Ending Note & Auto-Journey)
-- Request: Delete Ending Note and Journey Event automation components from Supabase

-- 1. Drop Triggers on user_favorites (Stop auto-creation of journey events)
DROP TRIGGER IF EXISTS trigger_auto_journey_on_favorite ON public.user_favorites;
DROP TRIGGER IF EXISTS trigger_auto_delete_journey_on_unfavorite ON public.user_favorites;

-- 2. Drop Automation Functions
DROP FUNCTION IF EXISTS public.auto_create_favorite_journey_event();
DROP FUNCTION IF EXISTS public.auto_delete_favorite_journey_event();

-- 3. Drop Ending Note Functions
DROP FUNCTION IF EXISTS public.upsert_ending_note(text[], text, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_my_ending_note();

-- 4. Drop Ending Note Table (If exists)
-- CAUTION: This deletes all data in user_ending_note
DROP TABLE IF EXISTS public.user_ending_note CASCADE;
