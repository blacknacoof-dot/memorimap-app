import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { logger } from '../utils/logger';

interface ApprovePartnerParams {
    inquiryId: string;
    action: 'approve' | 'reject';
    rejectionReason?: string;
}

interface ApprovePartnerResult {
    success: boolean;
    action: string;
    business_type?: string;
    error?: string;
}

export function useApprovePartner() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const approvePartner = async (params: ApprovePartnerParams): Promise<ApprovePartnerResult> => {
        setLoading(true);
        setError(null);

        try {
            const token = await getToken();

            if (!token) {
                logger.error('[approvePartner] No auth token available');
                throw new Error('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.');
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            if (!supabaseUrl) {
                throw new Error('Supabase URL이 설정되지 않았습니다.');
            }

            const functionUrl = `${supabaseUrl}/functions/v1/approve-partner`;

            logger.debug('[approvePartner] Sending request to:', functionUrl, 'params:', params);

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify(params)
            });

            let result: ApprovePartnerResult;
            try {
                result = await response.json();
            } catch {
                throw new Error(`서버 응답 파싱 실패 (HTTP ${response.status}). Edge Function이 배포되었는지 확인하세요.`);
            }

            if (!response.ok) {
                const serverError = result.error || `HTTP ${response.status}`;
                throw new Error(`승인/거절 실패: ${serverError}`);
            }

            return result;
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
