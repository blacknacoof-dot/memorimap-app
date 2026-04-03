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

// ?렞 PortOne 寃곗젣 ?붿껌
export const requestPayment = async (params: PaymentRequest): Promise<PaymentResponse> => {
    if (!window.PortOne) {
        throw new Error('PortOne SDK媛 濡쒕뱶?섏? ?딆븯?듬땲?? ?섏씠吏瑜??덈줈怨좎묠?댁＜?몄슂.');
    }

    // PortOne? 鍮?臾몄옄?댁쓣 嫄곕? (NON_EMPTY_STRING) ??鍮??꾨뱶 ?쒓굅
    const customer: Record<string, string> = {};
    if (params.customer.fullName) customer.fullName = params.customer.fullName;
    if (params.customer.phoneNumber) customer.phoneNumber = params.customer.phoneNumber;
    if (params.customer.email) customer.email = params.customer.email;

    try {
        // 理쒖냼 ?붿껌 ??KCP v2 怨듭떇 ?덉젣 湲곕컲 (windowType/bypass ?쒓굅, currency: CURRENCY_KRW)
        const requestBody: PortOneRequestPaymentParams = {
            storeId: params.storeId,
            channelKey: params.channelKey,
            paymentId: params.paymentId,
            orderName: params.orderName,
            totalAmount: params.totalAmount,
            currency: 'CURRENCY_KRW',
            payMethod: params.payMethod,
        };

        // customer (KCP ?꾩닔: fullName)
        if (Object.keys(customer).length > 0) {
            requestBody.customer = customer;
        }

        const response = await window.PortOne.requestPayment(requestBody);

        return response;

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : '';

        // ?ъ슜??移쒗솕???먮윭 硫붿떆吏
        if (errMsg.includes('User closed') || errMsg.includes('cancel')) {
            throw new Error('寃곗젣媛 痍⑥냼?섏뿀?듬땲??');
        }

        if (errMsg.includes('popup') || errMsg.includes('blocked')) {
            throw new Error('?앹뾽??李⑤떒?섏뿀?듬땲?? 釉뚮씪?곗? ?ㅼ젙?먯꽌 ?앹뾽???덉슜?댁＜?몄슂.');
        }

        throw new Error(errMsg || '寃곗젣 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
    }
};

/**
 * PortOne 梨꾨꼸 ??븷 遺꾨━ 援ъ“
 * - general: ?쇰컲寃곗젣 (?④굔, ?덉빟湲???
 * - billing: ?뺢린寃곗젣 (??援щ룆)
 *
 * ?꾩옱 NHN KCP ?곗꽑. 梨꾨꼸??媛숈쓣 寃쎌슦 ?숈씪 env 媛??ъ슜.
 * KG?대땲?쒖뒪 ?뺤옣 ??蹂꾨룄 env 異붽?留??섎㈃ ??
 *
 * env 蹂??
 *   VITE_PORTONE_STORE_ID          ???곸젏 ID (PG 臾닿?, 1媛?
 *   VITE_PORTONE_CHANNEL_KEY       ???쇰컲寃곗젣 梨꾨꼸 (fallback 寃몄슜)
 *   VITE_PORTONE_BILLING_CHANNEL_KEY ???뺢린寃곗젣 梨꾨꼸 (?놁쑝硫?general怨??숈씪)
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
    /** @deprecated CHANNEL_KEY 吏곸젒 ?ъ슜 ???getChannelKey() ?ъ슜 */
    get CHANNEL_KEY() { return this.CHANNELS.general; },
} as const;

/** ??븷蹂?梨꾨꼸 ??議고쉶 */
export function getChannelKey(role: PaymentRole = 'general'): string {
    const key = PORTONE_CONFIG.CHANNELS[role];
    if (!key) {
        throw new Error(`PortOne ${role} 梨꾨꼸 ?ㅺ? ?ㅼ젙?섏? ?딆븯?듬땲??`);
    }
    return key;
}

if (!PORTONE_CONFIG.STORE_ID || !PORTONE_CONFIG.CHANNELS.general) {
    // PortOne ?ㅼ젙 ?꾨씫 ??寃곗젣 湲곕뒫 ?ъ슜 ???고????먮윭濡?泥섎━
}

/**
 * ?쒕쾭?ъ씠??寃곗젣 寃利?(Edge Function ?몄텧)
 * ?대씪?댁뼵?몄뿉??寃곗젣 ?꾨즺 ??諛섎뱶???몄텧?섏뿬 湲덉븸/?곹깭 ?꾨?議?寃利?
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
        // [AUTH-14 FIX] ?ъ슜??JWT瑜?Authorization ?ㅻ뜑濡??꾩넚
        // Edge Function???몄쬆???ъ슜??+ ?덉빟 ?뚯쑀沅뚯쓣 寃利앺븯?꾨줉 蹂寃쎈맖
        const userToken = await getCurrentAccessToken();
        if (!userToken) {
            return { verified: false, error: '?몄쬆 ?좏겙???놁뒿?덈떎. 濡쒓렇?????ㅼ떆 ?쒕룄?댁＜?몄슂.' };
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
        const msg = error instanceof Error ? error.message : '寃곗젣 寃利??ㅽ뙣';
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
}): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return { success: false, error: 'Supabase URL not configured' };
    }

    try {
        const userToken = await getCurrentAccessToken();
        if (!userToken) {
            return { success: false, error: '?몄쬆 ?좏겙???놁뒿?덈떎. 濡쒓렇?????ㅼ떆 ?쒕룄??二쇱꽭??' };
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
        const msg = error instanceof Error ? error.message : '寃곗젣 以鍮?以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.';
        return { success: false, error: msg };
    }
};

/**
 * ?섎텋 ?붿껌 ?뚮옒洹?湲곕줉 (DB留??????섎텋 ?꾨떂)
 *
 * ?덉빟 嫄곗젅 ?깆뿉???몄텧?섏뿬 refund_status='requested'濡?留덊궧.
 * ?ㅼ젣 PortOne 痍⑥냼 API ?몄텧? processRefund()?먯꽌 ?섑뻾.
 *
 * ?먮룞 ?곌껐 蹂대쪟 ?ъ쑀:
 *   ?섎텋? ?ㅺ툑???대룞?대?濡? ?덉빟 嫄곗젅 ??利됱떆 ?먮룞 ?섎텋濡??곌껐?섎㈃
 *   ?ㅺ굅????蹂듦뎄 遺덇?. ?꾩옱???뚮옒洹몃쭔 湲곕줉?섍퀬, 愿由ъ옄媛 process-refund
 *   Edge Function???듯빐 紐낆떆?곸쑝濡??ㅽ뻾?섎뒗 援ъ“.
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
            return { success: false, error: error.message || '?섎텋 ?붿껌 ?ㅽ뙣' };
        }

        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '?섎텋 ?붿껌 ?ㅽ뙣';
        return { success: false, error: msg };
    }
};

/**
 * ?ㅼ젣 ?섎텋 ?ㅽ뻾 (process-refund Edge Function ?몄텧)
 *
 * ?쒕쾭?먯꽌 PortOne 痍⑥냼 API瑜??몄텧?섍퀬 DB ?곹깭瑜?媛깆떊.
 * ?몄쬆 + ?뚯쑀沅?+ ?곹깭 + 以묐났 痍⑥냼 諛⑹? 寃利앹? Edge Function ?대??먯꽌 ?섑뻾.
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
            return { success: false, error: '?몄쬆 ?좏겙???놁뒿?덈떎. 濡쒓렇?????ㅼ떆 ?쒕룄?댁＜?몄슂.' };
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
                error: result?.error || `?섎텋 泥섎━ ?ㅽ뙣 (${response.status})`,
            };
        }
        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '?섎텋 泥섎━ ?ㅽ뙣';
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
 * 鍮뚮쭅??諛쒓툒 ?붿껌 (移대뱶 ?깅줉留? 寃곗젣 X)
 * KCP 鍮뚮쭅???ъ쟾怨꾩빟 ?꾨즺 ???ъ슜 媛??
 */
export const requestIssueBillingKey = async (params: {
    channelKey?: string;
    issueId?: string;
    issueName?: string;
    customerName?: string;
    customerEmail?: string;
}): Promise<BillingKeyResponse> => {
    if (!window.PortOne?.requestIssueBillingKey) {
        throw new Error('PortOne SDK 鍮뚮쭅??諛쒓툒 湲곕뒫??濡쒕뱶?섏? ?딆븯?듬땲??');
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

/** paymentId ?앹꽦 ?좏떥 ??KCP 理쒕? 40?? ?곷Ц+?レ옄+_- 留?*/
export function generatePaymentId(prefix: string): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${ts}_${rand}`.slice(0, 40);
}

/** 鍮뚮쭅??諛쒓툒 issueId ?앹꽦 ??paymentId? 援щ텇 */
export function generateIssueId(prefix: string = 'bk'): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${ts}_${rand}`.slice(0, 40);
}

