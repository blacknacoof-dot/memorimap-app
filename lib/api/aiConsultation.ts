import { supabase } from '../supabaseClient';
import { AiConsultation, AiConsultationStatus } from '../../types';
import { logger } from '../../utils/logger';

/**
 * [Decision Lock] 2026-02-01 이후의 모든 AI 상담 데이터는 
 * 이 서비스를 통해서만 ai_consultations 테이블에 저장됩니다.
 */

export const aiConsultationService = {
    /**
     * 상담 세션 시작 또는 복구 (Upsert)
     * Ghost Session 방지를 위해 conversation_id 기반으로 작동
     */
    async startOrResumeConsultation(params: {
        conversationId: string;
        userId?: string;
        facilityId: string;
        facilityName: string;
        category: AiConsultation['category'];
        initialMessage?: any;
    }): Promise<AiConsultation | null> {
        const { conversationId, userId, facilityId, facilityName, category, initialMessage } = params;

        const { data, error } = await supabase
            .from('ai_consultations')
            .upsert({
                conversation_id: conversationId,
                user_id: userId || null,
                facility_id: facilityId || null,
                facility_name: facilityName,
                category,
                messages: initialMessage ? [initialMessage] : [],
                status: AiConsultationStatus.AI_HANDLING,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'conversation_id'
            })
            .select()
            .single();

        if (error) {
            logger.error('Failed to start/resume consultation:', error);
            throw error;
        }

        // [Event] CONSULTATION_CREATED (Realtime)
        return data as AiConsultation;
    },

    /**
     * 메시지 추가 (Append)
     */
    async appendMessage(conversationId: string, message: any) {
        // 1. 기존 메시지 로드
        const { data: current } = await supabase
            .from('ai_consultations')
            .select('messages')
            .eq('conversation_id', conversationId)
            .single();

        const updatedMessages = [...(current?.messages || []), message];

        // 2. 업데이트
        const { data, error } = await supabase
            .from('ai_consultations')
            .update({
                messages: updatedMessages,
                updated_at: new Date().toISOString()
            })
            .eq('conversation_id', conversationId)
            .select()
            .single();

        if (error) throw error;

        // [Event] MESSAGE_APPENDED 발송 가능 (Realtime)
        return data as AiConsultation;
    },

    /**
     * 상태 변경 (Update Status)
     * [Decision Lock] 관제용 이벤트 발송을 포함함
     */
    async updateStatus(conversationId: string, status: AiConsultationStatus, metadataUpdate?: Record<string, any>) {
        const updatePayload: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (metadataUpdate) {
            updatePayload.metadata = metadataUpdate;
        }

        let query = supabase
            .from('ai_consultations')
            .update(updatePayload)
            .eq('conversation_id', conversationId);

        // [Atomic Lock] 상담 개입 시 동시성 제어
        // 이미 다른 상담사가 연결된 경우(status != IA_HANDLING) 업데이트가 0 rows가 되도록 함
        if (status === AiConsultationStatus.AGENT_CONNECTED) {
            query = query.eq('status', AiConsultationStatus.AI_HANDLING);
        }

        const { data, error } = await query.select().single();

        if (error) throw error;

        // [Event] STATUS_CHANGED 발송 (Realtime)
        // Supabase Realtime 리스너가 이 UPDATE를 감지하여 어드민에 알림
        return data as AiConsultation;
    },

    /**
     * 상담 내역 조회
     */
    async getConsultation(conversationId: string): Promise<AiConsultation | null> {
        const { data, error } = await supabase
            .from('ai_consultations')
            .select('*')
            .eq('conversation_id', conversationId)
            .maybeSingle();

        if (error) {
            logger.error('Error fetching consultation:', error);
            return null;
        }
        return data as AiConsultation;
    },

    /**
     * 유저의 상담 목록 조회
     */
    async getUserConsultations(userId: string): Promise<AiConsultation[]> {
        const { data, error } = await supabase
            .from('ai_consultations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            logger.error('Error fetching user consultations:', error);
            return [];
        }
        return data as AiConsultation[];
    }
};
