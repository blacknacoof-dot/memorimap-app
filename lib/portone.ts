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
}

export interface PaymentResponse {
    paymentId: string;
    transactionId?: string;
    code?: string;
    message?: string;
    txId?: string;
}

// 🔧 강화된 모바일 감지 (인앱 브라우저 대응)
const detectDevice = () => {
    const ua = navigator.userAgent.toLowerCase();

    // 모바일 기기 감지
    const isMobileDevice = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);

    // 인앱 브라우저 감지 (네이버, 카카오, 페이스북, 인스타그램 등)
    const isInAppBrowser = /naver|kakaotalk|line|facebook|instagram|twitter/i.test(ua);

    // 터치 지원 여부
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 화면 크기 (태블릿 제외, 스마트폰만)
    const isSmallScreen = window.innerWidth <= 768;

    const isMobile = isMobileDevice || isInAppBrowser || (isTouchDevice && isSmallScreen);

    return isMobile;
};

// 🎯 PortOne 결제 요청
export const requestPayment = async (params: PaymentRequest): Promise<PaymentResponse> => {
    if (!window.PortOne) {
        throw new Error('PortOne SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
    }

    const isMobile = detectDevice();

    // URL 파라미터로 강제 모드 설정 가능 (디버깅용)
    const urlParams = new URLSearchParams(window.location.search);
    const forceMobile = urlParams.get('forceMobile') === 'true';
    const forcePC = urlParams.get('forcePC') === 'true';

    let _finalIsMobile = isMobile;
    if (forceMobile) _finalIsMobile = true;
    if (forcePC) _finalIsMobile = false;

    // ✅ PortOne이 요구하는 형식: 객체로 pc/mobile 각각 지정
    const windowType = {
        pc: 'IFRAME' as const,
        mobile: 'POPUP' as const
    };

    // PortOne은 빈 문자열을 거부 (NON_EMPTY_STRING) → 빈 필드 제거
    const customer: Record<string, string> = {};
    if (params.customer.fullName) customer.fullName = params.customer.fullName;
    if (params.customer.phoneNumber) customer.phoneNumber = params.customer.phoneNumber;
    if (params.customer.email) customer.email = params.customer.email;

    try {
        const response = await window.PortOne.requestPayment({
            storeId: params.storeId,
            channelKey: params.channelKey,
            paymentId: params.paymentId,
            orderName: params.orderName,
            totalAmount: params.totalAmount,
            currency: params.currency,
            payMethod: params.payMethod,
            ...(Object.keys(customer).length > 0 && { customer }),
            windowType: windowType, // ✅ 객체 형식으로 전달
        });

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

export const PORTONE_CONFIG = {
    STORE_ID: import.meta.env.VITE_PORTONE_STORE_ID ?? '',
    CHANNEL_KEY: import.meta.env.VITE_PORTONE_CHANNEL_KEY ?? '',
} as const;

if (!PORTONE_CONFIG.STORE_ID || !PORTONE_CONFIG.CHANNEL_KEY) {
    // PortOne 설정 누락 — 결제 기능 사용 시 런타임 에러로 처리
}

/**
 * 서버사이드 결제 검증 (Edge Function 호출)
 * 클라이언트에서 결제 완료 후 반드시 호출하여 금액/상태 위변조 검증
 */
export const verifyPayment = async (params: {
    paymentId: string;
    expectedAmount: number;
    orderId?: string;
    paymentContext?: 'reservation' | 'facility_subscription' | 'personal_subscription';
    facilityId?: string;
    planId?: string;
    targetUserId?: string;
}): Promise<{ verified: boolean; error?: string }> => {
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
        return result;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '결제 검증 실패';
        return { verified: false, error: msg };
    }
};

/**
 * 환불 요청 (서버사이드 Edge Function 필요)
 * 현재는 DB에 환불 요청 플래그만 기록 (수동 처리)
 */
export const requestRefund = async (params: {
    paymentId: string;
    reason: string;
    reservationId: string;
    client: import('@supabase/supabase-js').SupabaseClient;
}): Promise<{ success: boolean; error?: string }> => {
    // Edge Function 배포 전에는 DB 플래그만 기록
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
    windowType?: {
        pc: 'IFRAME' | 'POPUP' | 'REDIRECT';
        mobile: 'IFRAME' | 'POPUP' | 'REDIRECT';
    };
}

declare global {
    interface Window {
        PortOne?: {
            requestPayment: (params: PortOneRequestPaymentParams) => Promise<PaymentResponse>;
        };
    }
}
