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

    console.log('🔍 Device Detection:', {
        userAgent: ua,
        isMobileDevice,
        isInAppBrowser,
        isTouchDevice,
        isSmallScreen,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        finalDecision: isMobile ? 'MOBILE (POPUP)' : 'PC (IFRAME)'
    });

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

    let finalIsMobile = isMobile;
    if (forceMobile) finalIsMobile = true;
    if (forcePC) finalIsMobile = false;

    // ✅ PortOne이 요구하는 형식: 객체로 pc/mobile 각각 지정
    const windowType = {
        pc: 'IFRAME' as const,
        mobile: 'POPUP' as const
    };

    console.log('💳 Payment Request:', {
        device: finalIsMobile ? 'Mobile' : 'PC',
        windowType: finalIsMobile ? windowType.mobile : windowType.pc,
        amount: params.totalAmount,
        orderName: params.orderName,
        forceMobile,
        forcePC
    });

    try {
        const response = await window.PortOne.requestPayment({
            storeId: params.storeId,
            channelKey: params.channelKey,
            paymentId: params.paymentId,
            orderName: params.orderName,
            totalAmount: params.totalAmount,
            currency: params.currency,
            payMethod: params.payMethod,
            customer: params.customer,
            windowType: windowType, // ✅ 객체 형식으로 전달
        });

        console.log('✅ Payment Response:', response);
        return response;

    } catch (error: any) {
        console.error('❌ Payment Error:', error);

        // 사용자 친화적 에러 메시지
        if (error.message?.includes('User closed') || error.message?.includes('cancel')) {
            throw new Error('결제가 취소되었습니다.');
        }

        if (error.message?.includes('popup') || error.message?.includes('blocked')) {
            throw new Error('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        }

        throw new Error(error.message || '결제 처리 중 오류가 발생했습니다.');
    }
};

export const PORTONE_CONFIG = {
    STORE_ID: "store-64d04ed2-8945-4d77-b160-aba423285aa1",
    CHANNEL_KEY: "channel-key-63cd5e3b-b887-4910-9bfa-bca1d4644ae8",
};

declare global {
    interface Window {
        PortOne?: {
            requestPayment: (params: any) => Promise<any>;
        };
    }
}
