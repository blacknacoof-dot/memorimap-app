import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// PortOne V2 Webhook Handler
//
// 역할: 브라우저 종료/네트워크 이슈로 verify-payment 콜백이
// 누락된 결제를 웹훅으로 후속 동기화.
//
// 설계 원칙:
//   1. 웹훅 payload를 신뢰하지 않음 → PortOne API 재조회
//   2. 멱등 처리 → 이미 반영된 결제는 스킵
//   3. fail-closed → 시그니처 검증 실패 시 운영에서 거부
//
// 리팩터링 메모:
//   verify-payment와 공유하는 로직(PortOne API 조회, 구독 영속화)이
//   있으나, 현 단계에서는 안전을 위해 중복 구현.
//   후속 작업으로 _shared/ 분리 검토.
// ============================================================

const PORTONE_API_URL = 'https://api.portone.io';

type SupabaseAdmin = ReturnType<typeof createClient>;

// ============================================================
// Standard Webhooks 시그니처 검증 (HMAC-SHA256)
// ============================================================

async function verifyWebhookSignature(
    body: string,
    headers: Headers,
    secret: string,
): Promise<boolean> {
    const webhookId = headers.get('webhook-id');
    const webhookTimestamp = headers.get('webhook-timestamp');
    const webhookSignature = headers.get('webhook-signature');

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
        return false;
    }

    // 타임스탬프 검증 (±5분)
    const ts = parseInt(webhookTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
        return false;
    }

    // Standard Webhooks: secret은 "whsec_" prefix 후 base64
    const secretBytes = Uint8Array.from(
        atob(secret.startsWith('whsec_') ? secret.slice(6) : secret),
        c => c.charCodeAt(0),
    );

    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signedContent),
    );

    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // webhook-signature 헤더는 "v1,<base64>" 형식 (복수 가능, 공백 구분)
    const signatures = webhookSignature.split(' ');
    for (const sig of signatures) {
        const parts = sig.split(',');
        if (parts.length === 2 && parts[0] === 'v1' && parts[1] === expectedSig) {
            return true;
        }
    }

    return false;
}

// ============================================================
// PortOne API 결제 조회
// ============================================================

interface PortOnePayment {
    id: string;
    status: string; // PAID, CANCELLED, FAILED, READY, etc.
    amount?: { total?: number };
    orderName?: string;
    customData?: string;
    cancellations?: Array<{ id: string; totalAmount: number; reason?: string }>;
}

async function fetchPortOnePayment(
    paymentId: string,
    apiSecret: string,
): Promise<{ payment: PortOnePayment | null; error: string | null }> {
    try {
        const res = await fetch(`${PORTONE_API_URL}/payments/${paymentId}`, {
            headers: {
                'Authorization': `PortOne ${apiSecret}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            return { payment: null, error: `PortOne API ${res.status}: ${await res.text()}` };
        }
        const data = await res.json();
        return { payment: data as PortOnePayment, error: null };
    } catch (e) {
        return { payment: null, error: e instanceof Error ? e.message : 'fetch failed' };
    }
}

// ============================================================
// 로깅 헬퍼
// ============================================================

async function log(
    db: SupabaseAdmin,
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    meta: Record<string, unknown>,
): Promise<void> {
    await db.from('system_logs').insert({
        level,
        message,
        meta,
        source: 'edge-function:payment-webhook',
    });
}

// ============================================================
// 멱등 처리: 구독 결제 (PAID)
// ============================================================

async function handleSubscriptionPaid(
    db: SupabaseAdmin,
    payment: PortOnePayment,
): Promise<{ action: string }> {
    const paymentId = payment.id;
    const amount = payment.amount?.total ?? 0;

    // 1. subscription_payments에 이미 존재하면 스킵
    const { data: existingPayment } = await db
        .from('subscription_payments')
        .select('id, status')
        .eq('portone_payment_id', paymentId)
        .limit(1)
        .maybeSingle();

    if (existingPayment) {
        return { action: 'skipped:already_exists' };
    }

    // 2. paymentId prefix로 결제 유형 판별
    //    sub_ → facility, psub_ → personal
    const isFacility = paymentId.startsWith('sub_');
    const isPersonal = paymentId.startsWith('psub_');

    if (!isFacility && !isPersonal) {
        // 구독이 아닌 결제 (예약금 등) — 별도 처리
        return { action: 'not_subscription' };
    }

    // 웹훅만으로는 facilityId/planId/userId를 알 수 없음
    // verify-payment가 이미 처리했어야 하는 결제가 누락된 경우에만 도달
    // → 최소한 system_logs에 미처리 결제를 기록하여 수동 복구 가능하게 함
    await log(db, 'WARN', `웹훅 수신: 미처리 구독 결제 감지 (verify-payment 누락 가능)`, {
        paymentId,
        amount,
        orderName: payment.orderName,
        type: isFacility ? 'facility' : 'personal',
        recommendation: '관리자가 PortOne 대시보드에서 결제 확인 후 수동 반영 필요',
    });

    return { action: 'logged:needs_manual_review' };
}

// ============================================================
// 멱등 처리: 예약금 결제 (PAID)
// ============================================================

async function handleReservationPaid(
    db: SupabaseAdmin,
    payment: PortOnePayment,
): Promise<{ action: string }> {
    const paymentId = payment.id;

    // reservations.payment_id로 매칭
    const { data: reservation } = await db
        .from('reservations')
        .select('id, payment_verified')
        .eq('payment_id', paymentId)
        .limit(1)
        .maybeSingle();

    if (!reservation) {
        // 아직 예약이 생성되지 않았거나 매칭 불가
        // (클라이언트가 결제 후 예약 생성 전에 브라우저 닫힌 경우)
        await log(db, 'WARN', `웹훅: 예약 매칭 불가한 예약금 결제`, {
            paymentId,
            amount: payment.amount?.total,
            recommendation: 'PortOne 대시보드에서 결제 확인, 필요 시 수동 환불',
        });
        return { action: 'logged:reservation_not_found' };
    }

    if (reservation.payment_verified === true) {
        return { action: 'skipped:already_verified' };
    }

    // 멱등 업데이트
    const { error } = await db
        .from('reservations')
        .update({
            payment_verified: true,
            paid_at: new Date().toISOString(),
        })
        .eq('id', reservation.id)
        .eq('payment_verified', false); // 낙관적 락

    if (error) {
        await log(db, 'ERROR', `웹훅: 예약 결제 반영 실패`, {
            paymentId,
            reservationId: reservation.id,
            error: error.message,
        });
        return { action: 'error:update_failed' };
    }

    return { action: 'synced:reservation_verified' };
}

// ============================================================
// CANCELLED 처리
// ============================================================

async function handleCancelled(
    db: SupabaseAdmin,
    payment: PortOnePayment,
): Promise<{ action: string }> {
    const paymentId = payment.id;
    const actions: string[] = [];

    // 1. subscription_payments 상태 갱신
    const { data: subPayment } = await db
        .from('subscription_payments')
        .select('id, status, subscription_id, payment_context, user_id')
        .eq('portone_payment_id', paymentId)
        .limit(1)
        .maybeSingle();

    if (subPayment) {
        if (subPayment.status === 'refunded' || subPayment.status === 'cancelled') {
            actions.push('subscription_payment:skipped:already_cancelled');
        } else {
            // subscription_payments.status → 'refunded'
            await db
                .from('subscription_payments')
                .update({ status: 'refunded' })
                .eq('id', subPayment.id)
                .neq('status', 'refunded'); // 낙관적 락

            actions.push('subscription_payment:updated:refunded');

            // 2. 연관 구독 테이블 status 갱신
            if (subPayment.payment_context === 'facility' && subPayment.subscription_id) {
                const { data: facSub } = await db
                    .from('facility_subscriptions')
                    .select('id, status')
                    .eq('id', subPayment.subscription_id)
                    .limit(1)
                    .maybeSingle();

                if (facSub && facSub.status !== 'cancelled') {
                    await db
                        .from('facility_subscriptions')
                        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                        .eq('id', facSub.id)
                        .neq('status', 'cancelled');
                    actions.push('facility_subscription:updated:cancelled');
                } else {
                    actions.push('facility_subscription:skipped:already_cancelled_or_missing');
                }
            }

            if (subPayment.payment_context === 'personal' && subPayment.user_id) {
                const { data: userSub } = await db
                    .from('user_subscriptions')
                    .select('id, status')
                    .eq('user_id', subPayment.user_id)
                    .limit(1)
                    .maybeSingle();

                if (userSub && userSub.status !== 'cancelled') {
                    await db
                        .from('user_subscriptions')
                        .update({ status: 'cancelled' })
                        .eq('id', userSub.id)
                        .neq('status', 'cancelled');
                    actions.push('user_subscription:updated:cancelled');
                } else {
                    actions.push('user_subscription:skipped:already_cancelled_or_missing');
                }
            }
        }
    }

    // 3. 예약금 결제 취소 처리
    const { data: reservation } = await db
        .from('reservations')
        .select('id, refund_status')
        .eq('payment_id', paymentId)
        .limit(1)
        .maybeSingle();

    if (reservation) {
        if (reservation.refund_status === 'completed') {
            actions.push('reservation:skipped:already_refunded');
        } else {
            await db
                .from('reservations')
                .update({ refund_status: 'completed' })
                .eq('id', reservation.id)
                .neq('refund_status', 'completed');
            actions.push('reservation:updated:refund_completed');
        }
    }

    if (actions.length === 0) {
        actions.push('no_matching_records');
    }

    return { action: actions.join(', ') };
}

// ============================================================
// FAILED 처리
// ============================================================

async function handleFailed(
    db: SupabaseAdmin,
    payment: PortOnePayment,
): Promise<{ action: string }> {
    // FAILED 결제는 verify-payment에서 DB에 반영하지 않으므로
    // 정리할 중간 상태가 없음. 로깅만 수행.
    await log(db, 'INFO', `웹훅: 결제 실패 수신`, {
        paymentId: payment.id,
        amount: payment.amount?.total,
        orderName: payment.orderName,
    });

    return { action: 'logged:payment_failed' };
}

// ============================================================
// Main handler
// ============================================================

serve(async (req: Request) => {
    // CORS — 웹훅은 PortOne 서버에서 호출하므로 브라우저 CORS 불필요
    // 하지만 preflight 대응은 유지
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const portoneApiSecret = Deno.env.get('PORTONE_API_SECRET');
    if (!portoneApiSecret) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    // ============================================================
    // 시그니처 검증 — 운영에서 필수, 테스트에서만 완화
    // ============================================================
    const body = await req.text();
    const webhookSecret = Deno.env.get('PORTONE_WEBHOOK_SECRET');
    const isDevMode = Deno.env.get('ENVIRONMENT') === 'development';

    if (!webhookSecret) {
        if (!isDevMode) {
            // 운영: 시크릿 미설정이면 거부 (fail-closed)
            await log(db, 'ERROR', '웹훅 시크릿 미설정 — 운영 환경에서 웹훅 거부', {});
            return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // 개발: 시크릿 없으면 검증 스킵 (경고 로깅)
        await log(db, 'WARN', '웹훅 시그니처 검증 스킵 (개발 환경, 시크릿 미설정)', {});
    } else {
        const valid = await verifyWebhookSignature(body, req.headers, webhookSecret);
        if (!valid) {
            await log(db, 'ERROR', '웹훅 시그니처 검증 실패', {
                webhookId: req.headers.get('webhook-id'),
            });
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // ============================================================
    // Payload 파싱
    // ============================================================
    let webhookData: { type?: string; data?: { paymentId?: string } };
    try {
        webhookData = JSON.parse(body);
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const eventType = webhookData.type;
    const paymentId = webhookData.data?.paymentId;

    if (!paymentId) {
        // paymentId가 없는 이벤트 (BillingKey.Issued 등) — 현재 미처리
        await log(db, 'INFO', `웹훅: paymentId 없는 이벤트 수신 (무시)`, {
            type: eventType,
        });
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // ============================================================
    // PortOne API 재조회 (웹훅 payload 불신)
    // ============================================================
    const { payment, error: fetchError } = await fetchPortOnePayment(paymentId, portoneApiSecret);

    if (fetchError || !payment) {
        await log(db, 'ERROR', `웹훅: PortOne API 재조회 실패`, {
            paymentId,
            eventType,
            error: fetchError,
        });
        // 재시도 유도를 위해 5xx 반환
        return new Response(JSON.stringify({ error: 'PortOne API unavailable' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // ============================================================
    // 상태별 분기
    // ============================================================
    let result: { action: string };

    switch (payment.status) {
        case 'PAID': {
            // paymentId prefix로 예약금 vs 구독 구분
            if (paymentId.startsWith('pay_')) {
                result = await handleReservationPaid(db, payment);
            } else {
                result = await handleSubscriptionPaid(db, payment);
            }
            break;
        }
        case 'CANCELLED': {
            result = await handleCancelled(db, payment);
            break;
        }
        case 'FAILED': {
            result = await handleFailed(db, payment);
            break;
        }
        default: {
            // READY, PARTIAL_CANCELLED 등 — 현재 미처리
            await log(db, 'INFO', `웹훅: 미처리 상태 수신`, {
                paymentId,
                status: payment.status,
                eventType,
            });
            result = { action: `ignored:status_${payment.status}` };
        }
    }

    await log(db, 'INFO', `웹훅 처리 완료`, {
        paymentId,
        portonStatus: payment.status,
        eventType,
        action: result.action,
    });

    // 항상 200 반환 (PortOne이 재시도하지 않도록)
    // 단, PortOne API 조회 실패 시에만 5xx (위에서 이미 반환)
    return new Response(JSON.stringify({ ok: true, action: result.action }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
});
