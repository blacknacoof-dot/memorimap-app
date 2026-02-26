import type { SupabaseClient } from '@supabase/supabase-js';

import { SangjoContract, Partner, PartnerConversation, PartnerOperation, PlatformNotice } from '../types';

export interface SangjoTimelineEvent {
    id: string;
    contract_number: string;
    event: string;
    notes?: string;
    photo_url?: string;
    created_at: string;
}

/**
 * 상조 업체 이름으로 funeral_companies DB에서 실제 UUID를 조회
 * constants.ts의 가짜 ID('fc_new_1' 등)를 실제 DB UUID로 변환
 */
export const resolveSangjoDbId = async (
    companyId: string,
    companyName: string,
    client: SupabaseClient
): Promise<string> => {
    // 이미 UUID 형식이면 그대로 반환
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
        return companyId;
    }
    // 이름으로 DB에서 실제 UUID 조회
    const { data } = await client
        .from('funeral_companies')
        .select('id')
        .ilike('name', companyName)
        .limit(1)
        .maybeSingle();
    if (data?.id) return data.id;
    // 부분 매칭 시도
    const { data: partial } = await client
        .from('funeral_companies')
        .select('id')
        .ilike('name', `%${companyName.slice(0, 4)}%`)
        .limit(1)
        .maybeSingle();
    if (partial?.id) return partial.id;
    throw new Error(`상조 업체 '${companyName}'을 DB에서 찾을 수 없습니다.`);
};

export const saveSangjoContract = async (contract: SangjoContract, client: SupabaseClient) => {
    // 동일 고객(전화번호) 활성 계약 1건 제한
    if (contract.customer_phone) {
        const { data: existing } = await client
            .from('sangjo_contracts')
            .select('id, contract_number, sangjo_id')
            .eq('customer_phone', contract.customer_phone)
            .in('status', ['상담신청', '예약대기', '계약진행'])
            .limit(1);
        if (existing && existing.length > 0) {
            await client
                .from('sangjo_contracts')
                .update({ status: '완료' })
                .eq('id', existing[0].id);
        }
    }

    const { data, error } = await client
        .from('sangjo_contracts')
        .insert([contract])
        .select();

    if (error) {
        // Error saving sangjo contract
        throw error;
    }
    return data;
};

export const getSangjoContracts = async (sangjoId: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('sangjo_contracts')
        .select('*')
        .eq('sangjo_id', sangjoId)
        .order('created_at', { ascending: false });

    if (error) {
        // Error fetching sangjo contracts
        throw error;
    }
    return data;
};

export const updateContractStatus = async (contractNumber: string, status: string, additionalData: Record<string, unknown> = {}, client: SupabaseClient) => {
    const ALLOWED_FIELDS = ['approved_at', 'rejected_at', 'rejection_reason', 'notes', 'updated_by'];
    const safeData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
        if (key in additionalData) safeData[key] = additionalData[key];
    }
    const { data, error } = await client
        .from('sangjo_contracts')
        .update({
            status,
            ...safeData
        })
        .eq('contract_number', contractNumber)
        .select();

    if (error) {
        // Error updating contract status
        throw error;
    }
    return data;
};

export const addTimelineEvent = async (contractNumber: string, event: string, notes: string | undefined, photoUrl: string | undefined, client: SupabaseClient) => {
    const { data, error } = await client
        .from('sangjo_contract_timeline')
        .insert([{
            contract_number: contractNumber,
            event,
            notes,
            photo_url: photoUrl,
            created_at: new Date().toISOString()
        }])
        .select();

    if (error) {
        // Error adding timeline event
        throw error;
    }
    return data;
};

export const getTimelineEvents = async (contract_number: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('sangjo_contract_timeline')
        .select('*')
        .eq('contract_number', contract_number)
        .order('created_at', { ascending: true });

    if (error) {
        // Error fetching timeline events
        throw error;
    }
    return data as SangjoTimelineEvent[];
};

export const getSangjoUser = async (userId: string, client: SupabaseClient) => {
    // 1차: sangjo_dashboard_users 조회
    const { data } = await client
        .from('sangjo_dashboard_users')
        .select('sangjo_id, role, name')
        .eq('id', userId)
        .maybeSingle();

    if (data) return data;

    // 2차 fallback: sangjo_hq_admins 조회 (마이그레이션 전 기존 데이터 호환)
    const { data: hqData, error: hqError } = await client
        .from('sangjo_hq_admins')
        .select('sangjo_id, role, company_name')
        .eq('user_id', userId)
        .maybeSingle();

    if (hqError) {
        // Error fetching sangjo_hq_admins
        return null;
    }
    if (hqData) {
        return { sangjo_id: hqData.sangjo_id, role: hqData.role, name: hqData.company_name };
    }
    return null;
};

// --- Partners ---
export const getPartners = async (client: SupabaseClient) => {
    const { data, error } = await client
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Partner[];
};

export const updatePartnerStatus = async (partnerId: string, status: Partner['status'], approvedBy: string | undefined, client: SupabaseClient) => {
    const updateData: Record<string, unknown> = { status };
    if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = approvedBy;
    }
    const { data, error } = await client
        .from('partners')
        .update(updateData)
        .eq('id', partnerId)
        .select();
    if (error) throw error;
    return data;
};

// --- Conversations ---
export const getPartnerConversations = async (partnerId: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('partner_conversations')
        .select('*')
        .eq('partner_id', partnerId)
        .order('last_message_at', { ascending: false });
    if (error) throw error;
    return data as PartnerConversation[];
};

export const savePartnerConversation = async (conversation: Partial<PartnerConversation>, client: SupabaseClient) => {
    const { data, error } = await client
        .from('partner_conversations')
        .upsert([conversation])
        .select();
    if (error) throw error;
    return data;
};

// --- Operations ---
export const getPartnerOperations = async (partnerId: string, client: SupabaseClient) => {
    const { data, error } = await client
        .from('partner_operations')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as PartnerOperation[];
};

export const updateOperationStage = async (operationId: string, stage: PartnerOperation['operation_stage'], client: SupabaseClient) => {
    const { data, error } = await client
        .from('partner_operations')
        .update({ operation_stage: stage })
        .eq('id', operationId)
        .select();
    if (error) throw error;
    return data;
};

// --- Notices ---
export const getPlatformNotices = async (partnerId: string | undefined, client: SupabaseClient) => {
    let query = client.from('platform_notices').select('*').eq('is_active', true);
    if (partnerId) {
        // FE-01 FIX: .or() 문자열 보간 제거 → 2개 쿼리 분리 후 병합
        const sanitizedId = partnerId.replace(/[^a-zA-Z0-9_-]/g, '');
        if (sanitizedId) {
            query = query.or(
                `target_partner_ids.is.null,target_partner_ids.cs.{${sanitizedId}}`
            );
        } else {
            query = query.is('target_partner_ids', null);
        }
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as PlatformNotice[];
};

export const createPlatformNotice = async (notice: { title: string; content: string; notice_type: string; target_partner_ids?: string[] }, client: SupabaseClient) => {
    const { data, error } = await client.from('platform_notices').insert({ ...notice, is_active: true }).select().single();
    if (error) throw error;
    return data;
};

export const updatePlatformNotice = async (id: string, updates: Partial<{ title: string; content: string; notice_type: string; is_active: boolean }>, client: SupabaseClient) => {
    const { data, error } = await client.from('platform_notices').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deletePlatformNotice = async (id: string, client: SupabaseClient) => {
    const { error } = await client.from('platform_notices').update({ is_active: false }).eq('id', id);
    if (error) throw error;
};
