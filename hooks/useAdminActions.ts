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
 * 모든 DB 작업은 SECURITY DEFINER RPC 내부에서 원자적으로 처리
 * (시설 생성, 파트너 생성, 역할 변경, 자동 거절, 감사 로그, 알림 전부 포함)
 */
export function useApprovePartner(client: SupabaseClient) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const approvePartner = async (params: ApprovePartnerParams): Promise<ApprovePartnerResult> => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await client.auth.getUser();
            const adminId = user?.id;

            if (!adminId) {
                throw new Error('인증 정보를 가져올 수 없습니다. 다시 로그인해주세요.');
            }

            if (params.action === 'approve') {
                // approve_partner_transaction RPC:
                // 시설 생성 + 파트너 생성 + 역할 변경 + 동일 업체 자동 거절 + 감사 로그 + 알림
                const { data, error: rpcError } = await client
                    .rpc('approve_partner_transaction', {
                        p_inquiry_id: params.inquiryId,
                        p_admin_id: adminId
                    });

                if (rpcError) throw rpcError;

                const result = data as { success: boolean; error?: string } | null;
                if (result && !result.success) {
                    throw new Error(result.error || '승인 트랜잭션 실패');
                }

                return { success: true, action: 'approved' };
            }

            // reject_partner_transaction RPC:
            // 일괄 거절 + 감사 로그 + 알림
            const { data, error: rpcError } = await client
                .rpc('reject_partner_transaction', {
                    p_inquiry_id: params.inquiryId,
                    p_admin_id: adminId,
                    p_reason: params.rejectionReason || '운영팀 문의 요망'
                });

            if (rpcError) throw rpcError;

            const result = data as { success: boolean; error?: string } | null;
            if (result && !result.success) {
                throw new Error(result.error || '거절 트랜잭션 실패');
            }

            return { success: true, action: 'rejected' };

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
