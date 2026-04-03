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

// 🎯 PortOne 결제 요청
export const requestPayment = async (params: PaymentRequest): Promise<PaymentResponse> => {
    if (!window.PortOne) {
        throw new Error('PortOne SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
    }

    // PortOne은 빈 문자열을 거부 (NON_EMPTY_STRING) → 빈 필드 제거
    const customer: Record<string, string> = {};
    if (params.customer.fullName) customer.fullName = params.customer.fullName;
    if (params.customer.phoneNumber) customer.phoneNumber = params.customer.phoneNumber;
    if (params.customer.email) customer.email = params.customer.email;

    try {
        // 최소 요청 — KCP v2 공식 예제 기반 (windowType/bypass 제거, currency: CURRENCY_KRW)
        const requestBody: PortOneRequestPaymentParams = {
            storeId: params.storeId,
            channelKey: params.channelKey,
            paymentId: params.paymentId,
            orderName: params.orderName,
            totalAmount: params.totalAmount,
            currency: 'CURRENCY_KRW',
            payMethod: params.payMethod,
        };

        // customer (KCP 필수: fullName)
        if (Object.keys(customer).length > 0) {
            requestBody.customer = customer;
        }

        const response = await window.PortOne.requestPayment(requestBody);

        return response;

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : '';

        // 사용자 친화적 에러 메시지
        if (errMsg.includes('User closed') || errMsg.includes('cancel')) {
            throw new Error('결제가 취소되었습니다.');
        }

        if (errMsg.includes('popup') || errMsg.includes('blocked')) {
            throw new Error('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        }

        throw new Error(errMsg || '결제 처리 중 오류가 발생했습니다.');
    }
};

/**
 * PortOne 채널 역할 분리 구조
 * - general: 일반결제 (단건, 예약금 등)
 * - billing: 정기결제 (월 구독)
 *
 * 현재 NHN KCP 우선. 채널이 같을 경우 동일 env 값 사용.
 * KG이니시스 확장 시 별도 env 추가만 하면 됨.
 *
 * env 변수:
 *   VITE_PORTONE_STORE_ID          — 상점 ID (PG 무관, 1개)
 *   VITE_PORTONE_CHANNEL_KEY       — 일반결제 채널 (fallback 겸용)
 *   VITE_PORTONE_BILLING_CHANNEL_KEY — 정기결제 채널 (없으면 general과 동일)
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
    /** @deprecated CHANNEL_KEY 직접 사용 대신 getChannelKey() 사용 */
    get CHANNEL_KEY() { return this.CHANNELS.general; },
} as const;

/** 역할별 채널 키 조회 */
export function getChannelKey(role: PaymentRole = 'general'): string {
    const key = PORTONE_CONFIG.CHANNELS[role];
    if (!key) {
        throw new Error(`PortOne ${role} 채널 키가 설정되지 않았습니다.`);
    }
    return key;
}

if (!PORTONE_CONFIG.STORE_ID || !PORTONE_CONFIG.CHANNELS.general) {
    // PortOne 설정 누락 — 결제 기능 사용 시 런타임 에러로 처리
}

/**
 * 서버사이드 결제 검증 (Edge Function 호출)
 * 클라이언트에서 결제 완료 후 반드시 호출하여 금액/상태 위변조 검증
 */
export const verifyPayment = async (params: {
    paymentId?: string;
    expectedAmount?: number;
    orderId?: string;
    paymentContext?: 'reservation' | 'facility_subscription' | 'personal_subscription' | 'facility_free_downgrade' | 'personal_free_downgrade';
    facilityId?: string;
    planId?: string;
    targetUserId?: string;
}): Promise<{ verified: boolean; persisted?: boolean; error?: string; subscriptionId?: string }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return { verified: false, error: 'Supabase URL not configured' };
    }

    try {
        // [AUTH-14 FIX] 사용자 JWT를 Authorization 헤더로 전송
        // Edge Function이 인증된 사용자 + 예약 소유권을 검증하도록 변경됨
        const { getCurrentAccessToken } = await import('./supabaseClient');
        const userToken = await getCurrentAccessToken();
        if (!userToken) {
            return { verified: false, error: '인증 토큰이 없습니다. 로그인 후 다시 시도해주세요.' };
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

/**
 * 환불 요청 플래그 기록 (DB만 — 실 환불 아님)
 *
 * 예약 거절 등에서 호출하여 refund_status='requested'로 마킹.
 * 실제 PortOne 취소 API 호출은 processRefund()에서 수행.
 *
 * 자동 연결 보류 사유:
 *   환불은 실금전 이동이므로, 예약 거절 시 즉시 자동 환불로 연결하면
 *   오거절 시 복구 불가. 현재는 플래그만 기록하고, 관리자가 process-refund
 *   Edge Function을 통해 명시적으로 실행하는 구조.
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
 * 실제 환불 실행 (process-refund Edge Function 호출)
 *
 * 서버에서 PortOne 취소 API를 호출하고 DB 상태를 갱신.
 * 인증 + 소유권 + 상태 + 중복 취소 방지 검증은 Edge Function 내부에서 수행.
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
        const { getCurrentAccessToken } = await import('./supabaseClient');
        const userToken = await getCurrentAccessToken();
        if (!userToken) {
            return { success: false, error: '인증 토큰이 없습니다. 로그인 후 다시 시도해주세요.' };
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
 * 빌링키 발급 요청 (카드 등록만, 결제 X)
 * KCP 빌링키 사전계약 완료 후 사용 가능
 */
export const requestIssueBillingKey = async (params: {
    channelKey?: string;
    issueId?: string;
    issueName?: string;
    customerName?: string;
    customerEmail?: string;
}): Promise<BillingKeyResponse> => {
    if (!window.PortOne?.requestIssueBillingKey) {
        throw new Error('PortOne SDK 빌링키 발급 기능이 로드되지 않았습니다.');
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

/** paymentId 생성 유틸 — KCP 최대 40자, 영문+숫자+_- 만 */
export function generatePaymentId(prefix: string): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${ts}_${rand}`.slice(0, 40);
}

/** 빌링키 발급 issueId 생성 — paymentId와 구분 */
export function generateIssueId(prefix: string = 'bk'): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${ts}_${rand}`.slice(0, 40);
}
