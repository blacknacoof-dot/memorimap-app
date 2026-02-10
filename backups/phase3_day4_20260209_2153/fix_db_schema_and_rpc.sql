-- 1. Fix Missing Column in sangjo_dashboard_users
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sangjo_dashboard_users' AND column_name = 'plan_id') THEN
    ALTER TABLE public.sangjo_dashboard_users ADD COLUMN plan_id text;
  END IF;
END $$;

-- 2. Define or Replace the RPC Function for Admin Approval
-- This is required to bypass RLS when approving partners
CREATE OR REPLACE FUNCTION approve_facility_partner_rpc(
  p_inquiry_id bigint,
  p_target_user_id text,        -- The Clerk ID of the user being approved
  p_facility_id bigint,         -- Optional: ID of existing facility to link
  p_facility_data jsonb,        -- Optional: JSON {name, type, phone} for new facility
  p_admin_clerk_id text         -- The Clerk ID of the admin performing the action
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
AS $$
DECLARE
  v_new_facility_id bigint;
  v_admin_role text;
  v_facility_name text;
  v_facility_type text;
  v_facility_phone text;
BEGIN
  -- 1. Verify Admin Permissions
  -- Check if the caller (p_admin_clerk_id) has 'super_admin' role in public.users
  SELECT role INTO v_admin_role FROM public.users WHERE clerk_id = p_admin_clerk_id;
  
  IF v_admin_role IS NULL OR v_admin_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin can perform this action';
  END IF;

  -- 2. Handle Facility (Link Existing or Create New)
  IF p_facility_id IS NOT NULL THEN
    -- A. Link Existing Facility
    UPDATE public.memorial_spaces
    SET owner_user_id = p_target_user_id,
        data_source = 'partner',
        is_verified = true
    WHERE id = p_facility_id;
    
    v_new_facility_id := p_facility_id;
  ELSE
    -- B. Create New Facility
    -- Extract data from JSONB
    v_facility_name := p_facility_data->>'name';
    v_facility_type := p_facility_data->>'type';
    v_facility_phone := p_facility_data->>'phone';
    
    IF v_facility_name IS NULL THEN
        RAISE EXCEPTION 'Facility Name is required for new facility';
    END IF;

    INSERT INTO public.memorial_spaces (
        name, 
        type, 
        phone, 
        owner_user_id, 
        data_source, 
        is_verified, 
        address, 
        lat, 
        lng
    )
    VALUES (
        v_facility_name,
        v_facility_type,
        v_facility_phone,
        p_target_user_id,
        'partner',
        true,
        '주소 미입력', -- Placeholder
        37.5665,
        126.9780
    )
    RETURNING id INTO v_new_facility_id;
  END IF;

  -- 3. Update Target User Role
  UPDATE public.users
  SET role = 'facility_admin'
  WHERE clerk_id = p_target_user_id;

  -- 4. Update Inquiry Status
  UPDATE public.partner_inquiries
  SET status = 'approved',
      target_facility_id = v_new_facility_id,
      updated_at = now()
  WHERE id = p_inquiry_id;

END;
$$;
