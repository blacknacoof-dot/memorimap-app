
-- Re-applying create_consultation_from_lead function
-- This handles the handover from AI Lead to Consultation Table
-- Updated to match actual consultations table schema (20260106)

CREATE OR REPLACE FUNCTION public.create_consultation_from_lead(
    p_lead_id UUID,
    p_facility_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lead public.leads%ROWTYPE;
    v_new_consultation_id UUID;
    v_notes_text TEXT;
BEGIN
    -- 1. 리드 정보 조회
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found: %', p_lead_id;
    END IF;

    -- 2. Notes 필드 준비 (context_data를 JSON 문자열로 변환)
    v_notes_text := format(
        'Lead ID: %s | Category: %s | Urgency: %s | Context: %s',
        v_lead.id,
        COALESCE(v_lead.category, 'N/A'),
        COALESCE(v_lead.urgency, 'N/A'),
        COALESCE(v_lead.context_data::TEXT, '{}')
    );

    -- 3. 상담 테이블 생성 (실제 스키마에 맞춤)
    -- Schema: user_id (TEXT), facility_id (UUID), user_name, user_phone, status, notes
    INSERT INTO public.consultations (
        user_id, 
        facility_id, 
        user_name, 
        user_phone, 
        status, 
        notes
    ) VALUES (
        COALESCE(v_lead.user_id, 'anonymous'), 
        p_facility_id, 
        COALESCE(v_lead.contact_name, 'Unknown'), 
        COALESCE(v_lead.contact_phone, 'N/A'), 
        'pending', 
        v_notes_text
    )
    RETURNING id INTO v_new_consultation_id;

    -- 4. 리드 상태 업데이트
    UPDATE public.leads SET status = 'handed_over' WHERE id = p_lead_id;

    RETURN v_new_consultation_id;
END;
$$;
