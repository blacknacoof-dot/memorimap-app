-- Transaction start
BEGIN;

-- 1. Extension Schema Cleanup - SKIPPED
-- PostGIS does not support SET SCHEMA, so we keep it in public for now.
-- We proceed with RLS policy hardening.


-- 2. Partner Conversations Security
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.partner_conversations;
CREATE POLICY "Users can start conversations" ON public.partner_conversations
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid())::text = user_id);

-- 3. Partner Inquiries Security
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.partner_inquiries;
CREATE POLICY "Users can submit inquiries" ON public.partner_inquiries
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid())::text = user_id);

-- 4. Subscription Payments Security
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.subscription_payments;
CREATE POLICY "Users can insert payments for their subscriptions" ON public.subscription_payments
    FOR INSERT TO authenticated
    WITH CHECK (
        subscription_id IN (
            SELECT s.id 
            FROM public.subscriptions s
            JOIN public.facilities f ON s.facility_id = f.id
            WHERE f.user_id = (select auth.uid())::text
        )
    );

-- 5. User Notifications Security
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.user_notifications;

CREATE POLICY "Users can view their own notifications" ON public.user_notifications
    FOR SELECT TO authenticated
    USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
    FOR UPDATE TO authenticated
    USING ((select auth.uid())::text = user_id)
    WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Service role full access" ON public.user_notifications
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;
