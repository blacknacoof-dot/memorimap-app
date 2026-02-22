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
                throw new Error('인증 토큰을 가져올 수 없습니다');
            }

            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-partner`;

            logger.debug('[approvePartner] Token retrieved, sending request to:', functionUrl);

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify(params)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '처리 중 오류가 발생했습니다');
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
