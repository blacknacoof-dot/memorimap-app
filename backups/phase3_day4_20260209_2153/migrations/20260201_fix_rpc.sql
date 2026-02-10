-- Function: create_consultation_from_lead
-- Description: Creates a consultation record from an existing lead and links it to a facility.
-- Needed to fix 404 RPC error.

CREATE OR REPLACE FUNCTION public.create_consultation_from_lead(p_lead_id uuid, p_facility_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead record;
    v_consultation_id uuid;
    v_result json;
BEGIN
    -- 1. Get Lead Data
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
    
    IF v_lead IS NULL THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;

    -- 2. Create Consultation (Legacy or AI table? utilizing AI consultations for now as it's the context)
    -- Or if it's meant for the 'consultations' table (legacy), we insert there.
    -- Assuming 'ai_consultations' based on current context, OR 'consultations' if this is for the facility admin.
    -- Let's check 'consultations' schema usually requires user_id.

    -- [Decision] Insert into 'ai_consultations' as part of the AI flow handover
    INSERT INTO public.ai_consultations (
        user_id,
        facility_id,
        facility_name,
        status,
        summary,
        metadata
    ) VALUES (
        v_lead.user_id,
        p_facility_id,
        (SELECT name FROM facilities WHERE id = p_facility_id),
        'agent_connected', -- Handover status
        'Lead converted from AI Search: ' || coalesce(v_lead.category, 'General'),
        json_build_object(
            'lead_id', p_lead_id,
            'contact_name', v_lead.contact_name,
            'contact_phone', v_lead.contact_phone
        )
    )
    RETURNING conversation_id INTO v_consultation_id;

    -- 3. Update Lead Status
    UPDATE public.leads 
    SET status = 'converted', 
        converted_at = now() 
    WHERE id = p_lead_id;

    -- 4. Return Result
    SELECT json_build_object(
        'consultation_id', v_consultation_id,
        'status', 'success'
    ) INTO v_result;

    RETURN v_result;
END;
$$;
