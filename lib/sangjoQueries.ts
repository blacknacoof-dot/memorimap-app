import { supabase } from './supabaseClient';

import { SangjoContract, Partner, PartnerConversation, PartnerOperation, PlatformNotice } from '../types';

export interface SangjoTimelineEvent {
    id: string;
    contract_number: string;
    event: string;
    notes?: string;
    photo_url?: string;
    created_at: string;
}

export const saveSangjoContract = async (contract: SangjoContract) => {
    // 동일 고객(전화번호) 활성 계약 1건 제한
    if (contract.customer_phone) {
        const { data: existing } = await supabase
            .from('sangjo_contracts')
            .select('id, contract_number, sangjo_id')
            .eq('customer_phone', contract.customer_phone)
            .in('status', ['상담신청', '예약대기', '계약진행'])
            .limit(1);
        if (existing && existing.length > 0) {
            // 기존 활성 계약을 취소하고 새 계약으로 교체
            await supabase
                .from('sangjo_contracts')
                .update({ status: '완료' })
                .eq('id', existing[0].id);
            console.log(`🔄 기존 상조 계약 자동 종료: ${existing[0].contract_number}`);
        }
    }

    const { data, error } = await supabase
        .from('sangjo_contracts')
        .insert([contract]);

    if (error) {
        console.error('Error saving sangjo contract:', error);
        throw error;
    }
    return data;
};

export const getSangjoContracts = async (sangjoId: string) => {
    const { data, error } = await supabase
        .from('sangjo_contracts')
        .select('*')
        .eq('sangjo_id', sangjoId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sangjo contracts:', error);
        throw error;
    }
    return data;
};

export const updateContractStatus = async (contractNumber: string, status: string, additionalData: any = {}) => {
    const { data, error } = await supabase
        .from('sangjo_contracts')
        .update({
            status,
            ...additionalData
        })
        .eq('contract_number', contractNumber);

    if (error) {
        console.error('Error updating contract status:', error);
        throw error;
    }
    return data;
};

export const addTimelineEvent = async (contractNumber: string, event: string, notes?: string, photoUrl?: string) => {
    const { data, error } = await supabase
        .from('sangjo_contract_timeline')
        .insert([{
            contract_number: contractNumber,
            event,
            notes,
            photo_url: photoUrl,
            created_at: new Date().toISOString()
        }]);

    if (error) {
        console.error('Error adding timeline event:', error);
        throw error;
    }
    return data;
};

export const getTimelineEvents = async (contract_number: string) => {
    const { data, error } = await supabase
        .from('sangjo_contract_timeline')
        .select('*')
        .eq('contract_number', contract_number)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching timeline events:', error);
        throw error;
    }
    return data as SangjoTimelineEvent[];
};

export const getSangjoUser = async (userId: string) => {
    // 1차: sangjo_dashboard_users 조회
    const { data, error } = await supabase
        .from('sangjo_dashboard_users')
        .select('sangjo_id, role, name')
        .eq('id', userId)
        .maybeSingle();

    if (data) return data;
    if (error) console.error('Error fetching sangjo_dashboard_users:', error);

    // 2차 fallback: sangjo_hq_admins 조회 (마이그레이션 전 기존 데이터 호환)
    const { data: hqData, error: hqError } = await supabase
        .from('sangjo_hq_admins')
        .select('sangjo_id, role, company_name')
        .eq('user_id', userId)
        .maybeSingle();

    if (hqError) {
        console.error('Error fetching sangjo_hq_admins:', hqError);
        return null;
    }
    if (hqData) {
        return { sangjo_id: hqData.sangjo_id, role: hqData.role, name: hqData.company_name };
    }
    return null;
};

// --- Partners ---
export const getPartners = async () => {
    const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Partner[];
};

export const updatePartnerStatus = async (partnerId: string, status: Partner['status'], approvedBy?: string) => {
    const updateData: any = { status };
    if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = approvedBy;
    }
    const { data, error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', partnerId);
    if (error) throw error;
    return data;
};

// --- Conversations ---
export const getPartnerConversations = async (partnerId: string) => {
    const { data, error } = await supabase
        .from('partner_conversations')
        .select('*')
        .eq('partner_id', partnerId)
        .order('last_message_at', { ascending: false });
    if (error) throw error;
    return data as PartnerConversation[];
};

export const savePartnerConversation = async (conversation: Partial<PartnerConversation>) => {
    const { data, error } = await supabase
        .from('partner_conversations')
        .upsert([conversation]);
    if (error) throw error;
    return data;
};

// --- Operations ---
export const getPartnerOperations = async (partnerId: string) => {
    const { data, error } = await supabase
        .from('partner_operations')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as PartnerOperation[];
};

export const updateOperationStage = async (operationId: string, stage: PartnerOperation['operation_stage']) => {
    const { data, error } = await supabase
        .from('partner_operations')
        .update({ operation_stage: stage })
        .eq('id', operationId);
    if (error) throw error;
    return data;
};

// --- Notices ---
export const getPlatformNotices = async (partnerId?: string) => {
    let query = supabase.from('platform_notices').select('*').eq('is_active', true);
    if (partnerId) {
        // 특정 파트너 대상 또는 전체 대상 공지
        query = query.or(`target_partner_ids.is.null,target_partner_ids.cs.{${partnerId}}`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as PlatformNotice[];
};
