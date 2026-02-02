
-- 1. CHAT EVENTS (Activity Stream)
CREATE TABLE IF NOT EXISTS public.chat_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id), -- Can be null for anonymous
  session_id text, -- Tracking ID for anonymous users
  partner_id text NOT NULL, -- Target Sangjo company ID
  event_type text NOT NULL, -- 'VIEW_PRODUCT', 'EMERGENCY_REQUEST', 'VIEW_PROCESS', 'RESERVATION_CLICK'
  payload jsonb DEFAULT '{}'::jsonb, -- Details (product_id, etc.)
  created_at timestamptz DEFAULT now()
);

-- 2. EMERGENCY REQUESTS (Red Alert)
CREATE TABLE IF NOT EXISTS public.emergency_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id text NOT NULL,
  customer_name text,
  customer_phone text,
  location text,
  status text DEFAULT 'NEW', -- 'NEW', 'CHECKING', 'DISPATCHED', 'COMPLETED'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. PRODUCT CLICK LOGS (Analytics)
CREATE TABLE IF NOT EXISTS public.product_click_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id text NOT NULL,
  product_id text NOT NULL,
  product_name text,
  user_id uuid REFERENCES auth.users(id),
  clicked_at timestamptz DEFAULT now()
);

-- 4. CONSULTATION ENRICHMENT (Adding context columns)
-- Adjusting 'partner_inquiries' or creating 'consultations' based on existing structure.
-- Assuming 'partner_inquiries' is the main table for now based on previous context, 
-- but creating a clean 'consultations' table for the new flow is safer if distinct.
CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  customer_name text,
  customer_phone text,
  reservation_type text, -- 'CALL', 'CHAT'
  preferred_time text,
  status text DEFAULT 'PENDING',
  is_emergency boolean DEFAULT false,
  handover_reason text, -- 'REQUEST', 'EMERGENCY', 'RESERVATION'
  last_chat_summary text,
  created_at timestamptz DEFAULT now()
);

-- 5. RLS POLICIES (Allow Public Insert for Chat)
ALTER TABLE public.chat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to insert (since chat can be anonymous/guest)
CREATE POLICY "Enable insert for all users" ON public.chat_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.emergency_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.product_click_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.consultations FOR INSERT WITH CHECK (true);

-- Allow Partners to View (Assuming partner_id matches auth.uid or similar - Placeholder for now)
-- For now, allow public read only for dev/demo or strictly restrict. 
-- Safer: Only Service Role can read, or public for dev. Let's keep it restricted for now.
