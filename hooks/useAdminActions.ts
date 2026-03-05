import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ApprovePartnerParams {
    inquiryId: string;
    action: 'approve' | 'reject';
    rejectionReason?: string;
}

interface ApprovePartnerResult {
    success: boolean;
    action: string;
    error?: string;
}

/**
 * 파트너 승인/거절 훅
 * Edge Function `approve-partner` 경유:
 * - JWT 검증 + super_admin 역할 확인
 * - 원자적 DB 트랜잭션 (시설 생성, 파트너 생성, 역할 변경, 자동 거절, 감사 로그)
 * - 이메일 알림 발송 (Resend)
 * - 인앱 알림 저장
 */
export function useApprovePartner(client: SupabaseClient) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const approvePartner = async (params: ApprovePartnerParams): Promise<ApprovePartnerResult> => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fnError } = await client.functions.invoke('approve-partner', {
                body: {
                    inquiryId: params.inquiryId,
                    action: params.action,
                    ...(params.rejectionReason ? { rejectionReason: params.rejectionReason } : {}),
                },
            });

            if (fnError) throw fnError;

            const result = data as { success?: boolean; error?: string; action?: string } | null;
            if (result?.success === false) {
                throw new Error(result.error || '처리 실패');
            }

            return { success: true, action: result?.action ?? params.action };

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { approvePartner, loading, error };
}
