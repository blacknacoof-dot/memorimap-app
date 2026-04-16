import { getCurrentAccessToken } from './supabaseClient';

export interface PaymentRequest {
    storeId: string;
    channelKey: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: string;
    payMethod: string;
    customer: {
        fullName: string;
        phoneNumber: string;
        email?: string;
    };
    bypass?: {
        kcp_v2?: {
            site_name?: string;
            shop_user_id?: string;
            site_logo?: string;
            skin_indx?: string;
            kcp_pay_title?: string;
        };
    };
}

export interface PaymentResponse {
    paymentId: string;
    transactionId?: string;
    code?: string;
    message?: string;
    txId?: string;
}

function getPaymentErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null) {
        const maybeMessage = 'message' in error ? error.message : undefined;
        if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
            return maybeMessage;
        }

        const maybeCode = 'code' in error ? error.code : undefined;
        if (typeof maybeCode === 'string' && maybeCode.length > 0) {
            return maybeCode;
        }
    }

    return '';
}

// PortOne 결제 요청
export const requestPayment = async (params: PaymentRequest): Promise<PaymentResponse> => {
    if (!window.PortOne) {
        throw new Error('PortOne SDK가 로드되지 않았습니다. 페이지를 새로고침해 주세요.');
    }

    // PortOne rejects empty strings, so omit empty customer fields.
    const customer: Record<string, string> = {};
    if (params.customer.fullName) customer.fullName = params.customer.fullName;
    if (params.customer.phoneNumber) customer.phoneNumber = params.customer.phoneNumber;
    if (params.customer.email) customer.email = params.customer.email;

    try {
        // Minimal KCP v2 request body. Keep currency in PortOne's CURRENCY_KRW format.
        const requestBody: PortOneRequestPaymentParams = {
            storeId: params.storeId,
            channelKey: params.channelKey,
            paymentId: params.paymentId,
            orderName: params.orderName,
            totalAmount: params.totalAmount,
            currency: 'CURRENCY_KRW',
            payMethod: params.payMethod,
        };

        // customer: KCP requires fullName when customer is provided.
        if (Object.keys(customer).length > 0) {
            requestBody.customer = customer;
        }

        const response = await window.PortOne.requestPayment(requestBody);

        return response;

    } catch (error: unknown) {
        const errMsg = getPaymentErrorMessage(error);

        // User-friendly payment error messages.
        if (errMsg.includes('User closed') || errMsg.includes('cancel')) {
            throw new Error('결제가 취소되었습니다.');
        }

        if (errMsg.includes('popup') || errMsg.includes('blocked')) {
            throw new Error('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해 주세요.');
        }

        throw new Error(errMsg || '결제 처리 중 오류가 발생했습니다.');
    }
};

/**
 * PortOne channel role separation.
 * - general: one-time payments
 * - billing: recurring payments
 *
 * Current default is NHN KCP. If both channels use the same channel, use the same env value.
 * Add a separate env value when expanding to another PG or billing-only channel.
 *
 * Env:
 *   VITE_PORTONE_STORE_ID
 *   VITE_PORTONE_CHANNEL_KEY
 *   VITE_PORTONE_BILLING_CHANNEL_KEY
 */
export type PaymentRole = 'general' | 'billing';

export const PORTONE_CONFIG = {
    STORE_ID: import.meta.env.VITE_PORTONE_STORE_ID ?? '',
    CHANNELS: {
        general: import.meta.env.VITE_PORTONE_CHANNEL_KEY ?? '',
        billing: import.meta.env.VITE_PORTONE_BILLING_CHANNEL_KEY
            || import.meta.env.VITE_PORTONE_CHANNEL_KEY
            || '',
    },
    RECURRING_ENABLED: import.meta.env.VITE_ENABLE_RECURRING_SUBSCRIPTIONS === 'true',
    /** @deprecated Use getChannelKey() instead. */
    get CHANNEL_KEY() { return this.CHANNELS.general; },
} as const;

/** Get the PortOne channel key for a payment role. */
export function getChannelKey(role: PaymentRole = 'general'): string {
    const key = PORTONE_CONFIG.CHANNELS[role];
    if (!key) {
        throw new Error(`PortOne ${role} 채널 키가 설정되지 않았습니다.`);
    }
    return key;
}

export function isRecurringSubscriptionEnabled(): boolean {
    return PORTONE_CONFIG.RECURRING_ENABLED;
}

if (!PORTONE_CONFIG.STORE_ID || !PORTONE_CONFIG.CHANNELS.general) {
    // Missing PortOne config is surfaced when a payment flow starts.
}

/**
 * Server-side payment verification through an Edge Function.
 * Call this after client-side payment completion to verify amount and state.
 */
export const verifyPayment = async (params: {
    paymentId?: string;
    expectedAmount?: number;
    orderId?: string;
    paymentContext?: 'reservation' | 'facility_subscription' | 'personal_subscription' | 'facility_free_downgrade' | 'personal_free_downgrade';
    facilityId?: string;
    planId?: string;
    targetUserId?: string;
    authToken?: string | null;
}): Promise<{ verified: boolean; persisted?: boolean; error?: string; subscriptionId?: string }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return { verified: false, error: 'Supabase URL not configured' };
    }

    try {
        // Send the user JWT so the Edge Function can verify identity and ownership.
        const userToken = params.authToken || await getCurrentAccessToken();
        if (!userToken) {
            return { verified: false, error: '인증 토큰이 없습니다. 로그인 후 다시 시도해 주세요.' };
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify(params),
        });

        const result = await response.json();
        if (!response.ok) {
            return {
                verified: false,
                error: result?.error || result?.details || `verify-payment failed (${response.status})`,
            };
        }
        return result;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '결제 검증 실패';
        return { verified: false, error: msg };
    }
};

export const registerPaymentIntent = async (params: {
    paymentId: string;
    expectedAmount: number;
    paymentContext: 'facility_subscription' | 'personal_subscription';
    planId: string;
    facilityId?: string;
    targetUserId?: string;
    orderName?: string;
    authToken?: string | null;
}): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return { success: false, error: 'Supabase URL not configured' };
    }

    try {
        const userToken = params.authToken || await getCurrentAccessToken();
        if (!userToken) {
            return { success: false, error: '인증 토큰이 없습니다. 로그인 후 다시 시도해 주세요.' };
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/register-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify(params),
        });

        const result = await response.json();
        if (!response.ok) {
            return {
                success: false,
                error: result?.error || `register-payment-intent failed (${response.status})`,
            };
        }

        return {
            success: true,
            alreadyExists: result?.alreadyExists === true,
        };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '결제 준비 중 오류가 발생했습니다.';
        return { success: false, error: msg };
    }
};

export const issueBillingKeySubscription = async (params: {
    billingKey: string;
    planId: string;
    paymentContext: 'facility_subscription' | 'personal_subscription';
    facilityId?: string;
    targetUserId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhoneNumber?: string;
    orderName?: string;
    authToken?: string | null;
}): Promise<{ success: boolean; error?: string; paymentId?: string; subscriptionId?: string }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return { success: false, error: 'Supabase URL not configured' };
    }

    try {
        const userToken = params.authToken || await getCurrentAccessToken();
        if (!userToken) {
            return { success: false, error: '인증 토큰이 없습니다. 로그인 후 다시 시도해 주세요.' };
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/issue-billing-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify(params),
        });

        const result = await response.json();
        if (!response.ok) {
            return {
                success: false,
                error: result?.error || `issue-billing-key failed (${response.status})`,
            };
        }

        return {
            success: result?.success === true,
            error: result?.error,
            paymentId: result?.paymentId,
            subscriptionId: result?.subscriptionId,
        };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '정기결제 등록 중 오류가 발생했습니다.';
        return { success: false, error: msg };
    }
};

/**
 * Record a refund request flag in the DB. This does not call PortOne cancellation.
 * Actual cancellation is handled by processRefund() through an Edge Function.
 */
export const requestRefund = async (params: {
    paymentId: string;
    reason: string;
    reservationId: string;
    client: import('@supabase/supabase-js').SupabaseClient;
}): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await params.client.from('reservations').update({
            refund_status: 'requested',
            refund_reason: params.reason,
            payment_id: params.paymentId,
        }).eq('id', params.reservationId);

        if (error) {
            return { success: false, error: error.message || '환불 요청 실패' };
        }

        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '환불 요청 실패';
        return { success: false, error: msg };
    }
};

/**
 * Execute an actual refund through the process-refund Edge Function.
 * The Edge Function verifies auth, ownership, state, and duplicate cancellation.
 */
export const processRefund = async (params: {
    paymentId: string;
    reason: string;
    reservationId: string;
}): Promise<{ success: boolean; error?: string }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return { success: false, error: 'Supabase URL not configured' };
    }

    try {
        const userToken = await getCurrentAccessToken();
        if (!userToken) {
            return { success: false, error: '인증 토큰이 없습니다. 로그인 후 다시 시도해 주세요.' };
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/process-refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                paymentId: params.paymentId,
                reason: params.reason,
                reservationId: params.reservationId,
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            return {
                success: false,
                error: result?.error || `환불 처리 실패 (${response.status})`,
            };
        }
        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '환불 처리 실패';
        return { success: false, error: msg };
    }
};

interface PortOneRequestPaymentParams {
    storeId: string;
    channelKey: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: string;
    payMethod: string;
    customer?: {
        fullName?: string;
        phoneNumber?: string;
        email?: string;
    };
    bypass?: Record<string, unknown>;
}

interface PortOneIssueBillingKeyParams {
    storeId: string;
    channelKey: string;
    billingKeyMethod: string;
    issueId?: string;
    issueName?: string;
    customer?: {
        fullName?: string;
        email?: string;
    };
    offerPeriod?: {
        interval: string;
    };
    bypass?: Record<string, unknown>;
}

export interface BillingKeyResponse {
    billingKey?: string;
    code?: string;
    message?: string;
}

declare global {
    interface Window {
        PortOne?: {
            requestPayment: (params: PortOneRequestPaymentParams) => Promise<PaymentResponse>;
            requestIssueBillingKey?: (params: PortOneIssueBillingKeyParams) => Promise<BillingKeyResponse>;
        };
    }
}

/**
 * Request billing key issuance. This registers a card but does not charge it.
 * KCP billing requires the relevant contract to be enabled first.
 */
export const requestIssueBillingKey = async (params: {
    channelKey?: string;
    issueId?: string;
    issueName?: string;
    customerName?: string;
    customerEmail?: string;
}): Promise<BillingKeyResponse> => {
    if (!window.PortOne?.requestIssueBillingKey) {
        throw new Error('PortOne SDK의 빌링키 발급 기능이 로드되지 않았습니다.');
    }

    const customer: Record<string, string> = {};
    if (params.customerName) customer.fullName = params.customerName;
    if (params.customerEmail) customer.email = params.customerEmail;

    const response = await window.PortOne.requestIssueBillingKey({
        storeId: PORTONE_CONFIG.STORE_ID,
        channelKey: params.channelKey || getChannelKey('billing'),
        billingKeyMethod: 'CARD',
        ...(params.issueId && { issueId: params.issueId }),
        ...(params.issueName && { issueName: params.issueName }),
        ...(Object.keys(customer).length > 0 && { customer }),
        bypass: {
            kcp_v2: { site_name: '추모맵' },
        },
    });

    return response;
};

/** Generate a paymentId. KCP allows up to 40 ASCII letters, digits, underscores, and hyphens. */
export function generatePaymentId(prefix: string): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${ts}_${rand}`.slice(0, 40);
}

/** Generate an issueId for billing key issuance. Keep it distinct from paymentId. */
export function generateIssueId(prefix: string = 'bk'): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${ts}_${rand}`.slice(0, 40);
}

