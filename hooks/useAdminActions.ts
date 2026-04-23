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
    warning?: string;
}

/**
 * Partner approve/reject hook.
 * Calls Edge Function `approve-partner`.
 */
export function useApprovePartner(client: SupabaseClient) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const extractErrorMessage = async (err: unknown): Promise<string> => {
        if (err instanceof Error) {
            const maybeContext = (err as Error & { context?: Response }).context;
            if (maybeContext && typeof maybeContext.json === 'function') {
                try {
                    const payload = await maybeContext.json() as { error?: string; message?: string };
                    if (payload?.error) return payload.error;
                    if (payload?.message) return payload.message;
                } catch {
                    // Ignore parse error and fallback to err.message.
                }
            }
            return err.message;
        }
        return 'Unknown error';
    };

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

            const result = data as { success?: boolean; error?: string; action?: string; warning?: string | null } | null;
            if (result?.success === false) {
                throw new Error(result.error || 'Request failed.');
            }

            return {
                success: true,
                action: result?.action ?? params.action,
                warning: result?.warning || undefined,
            };
        } catch (err) {
            const errorMessage = await extractErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { approvePartner, loading, error };
}
