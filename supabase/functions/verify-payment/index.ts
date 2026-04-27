import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { rateLimit } from '../_shared/rateLimit.ts'
import { normalizeKcpReviewFields, upsertPaymentAudit, type ClientPaymentResult } from "../_shared/paymentAudit.ts";

const PRODUCTION_ORIGINS = [
    'https://memorimap.kr',
    'https://www.memorimap.kr',
    'https://memorimap-app.vercel.app',
    'https://memorimap-app-ptys-projects.vercel.app',
];

// 개발 환경에서만 localhost 허용 (ENVIRONMENT=development 설정 시)
const DEV_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];

// Local frontend validation should work regardless of the deployed ENVIRONMENT value.
const ALLOWED_ORIGINS = [...PRODUCTION_ORIGINS, ...DEV_ORIGINS];

const getCorsHeaders = (req: Request) => {
    const origin = req.headers.get('origin');
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : PRODUCTION_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Credentials': 'true',
    };
};

/**
 * JWT 검증 — Supabase Auth native verification
 */
async function verifyJWT(token: string): Promise<{ userId: string | null; error: string | null }> {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
        return { userId: null, error: 'Supabase not configured' };
    }

    try {
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return { userId: null, error: authError?.message || 'Invalid or expired token' };
        }

        return { userId: user.id, error: null };
    } catch (e) {
        return { userId: null, error: e.message || 'Token verification failed' };
    }
}

const PORTONE_API_URL = 'https://api.portone.io';

type SupabaseAdmin = ReturnType<typeof createClient>;
type PaymentIntentRow = {
    payment_id: string;
    payment_context: 'facility_subscription' | 'personal_subscription';
    user_id: string;
    facility_id: string | null;
    plan_id: string;
    expected_amount: number;
    status: 'pending' | 'sync_required' | 'paid' | 'failed' | 'cancelled';
};

async function verifySubscriptionPlanExists(
    supabaseAdmin: SupabaseAdmin,
    planId: string,
): Promise<boolean> {
    const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('id, is_active')
        .eq('name_en', planId)
        .limit(1)
        .maybeSingle();

    // is_active가 null이면 (마이그레이션 전) true로 간주
    return !error && !!data && (data.is_active !== false);
}

async function verifyFacilityOwnership(
    supabaseAdmin: SupabaseAdmin,
    facilityId: string,
    verifiedUserId: string,
): Promise<boolean> {
    // 1. facilities.user_id 직접 소유 확인
    const { data, error } = await supabaseAdmin
        .from('facilities')
        .select('user_id')
        .eq('id', facilityId)
        .maybeSingle();

    if (!error && data && data.user_id === verifiedUserId) {
        return true;
    }

    // 2. 상조 본사 관리자 (sangjo_hq_admins) 확인 — sangjo 시설은 user_id가 system_sangjo_import인 경우
    const { data: adminData, error: adminError } = await supabaseAdmin
        .from('sangjo_hq_admins')
        .select('id')
        .eq('sangjo_id', facilityId)
        .eq('user_id', verifiedUserId)
        .limit(1)
        .maybeSingle();

    return !adminError && !!adminData;
}

// ============================================================
// DB 영속화: 구독 + 결제이력 (service_role — RLS 무시)
// ============================================================

/** plan_id 정규화: subscription_plans.name_en 기준 (대문자 유지) */
function normalizePlanId(planId: string, _context: string): string {
    // FK가 subscription_plans.name_en 참조 → 원본 유지 (FREE, BASIC, PREMIUM, SJ_STARTER 등)
    return planId.trim().replace(/[\s-]+/g, '_').toUpperCase();
}

async function getPaymentIntent(
    db: SupabaseAdmin,
    paymentId: string,
): Promise<PaymentIntentRow | null> {
    const { data, error } = await db
        .from('payment_intents')
        .select('payment_id, payment_context, user_id, facility_id, plan_id, expected_amount, status')
        .eq('payment_id', paymentId)
        .limit(1)
        .maybeSingle();

    return error ? null : (data as PaymentIntentRow | null);
}

async function updatePaymentIntentStatus(
    db: SupabaseAdmin,
    paymentId: string,
    status: 'pending' | 'sync_required' | 'paid' | 'failed' | 'cancelled',
    portoneStatus: string,
): Promise<void> {
    await db
        .from('payment_intents')
        .update({
            status,
            portone_status: portoneStatus,
            resolved_at: status === 'pending' || status === 'sync_required' ? null : new Date().toISOString(),
        })
        .eq('payment_id', paymentId)
        .neq('status', status);
}

async function persistFacilitySubscription(
    db: SupabaseAdmin,
    facilityId: string,
    planId: string,
    portonePaymentId: string,
    amount: number,
): Promise<{ persisted: boolean; error?: string; subscriptionId?: string }> {
    const normalizedPlanId = normalizePlanId(planId, 'facility');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    try {
        const { data: existingPayment } = await db
            .from('subscription_payments')
            .select('id, subscription_id')
            .eq('portone_payment_id', portonePaymentId)
            .limit(1)
            .maybeSingle();

        if (existingPayment) {
            return { persisted: true, subscriptionId: existingPayment.subscription_id ?? undefined };
        }

        // 1. 기존 구독 조회 + 이전 상태 캡처 (롤백용)
        const filterCol = isUUID ? 'facility_id_uuid' : 'facility_id_bigint';
        const filterVal = isUUID ? facilityId : Number(facilityId);

        const { data: existing } = await db
            .from('facility_subscriptions')
            .select('id, plan_id, status, next_billing_date, billing_cycle')
            .eq(filterCol, filterVal)
            .limit(1)
            .maybeSingle();

        const previousState = existing
            ? { plan_id: existing.plan_id, status: existing.status, next_billing_date: existing.next_billing_date, billing_cycle: existing.billing_cycle }
            : null;

        const subscriptionData: Record<string, unknown> = {
            plan_id: normalizedPlanId,
            status: 'active',
            next_billing_date: nextBilling.toISOString(),
            updated_at: now.toISOString(),
            billing_cycle: 'monthly',
        };

        let subId: string | null = null;
        const wasInsert = !existing;

        if (existing) {
            const { data, error } = await db
                .from('facility_subscriptions')
                .update(subscriptionData)
                .eq('id', existing.id)
                .select('id')
                .single();

            if (error) return { persisted: false, error: `facility_subscriptions UPDATE: ${error.message}` };
            subId = data?.id;
        } else {
            if (isUUID) {
                subscriptionData.facility_id_uuid = facilityId;
            } else {
                subscriptionData.facility_id_bigint = Number(facilityId);
                subscriptionData.facility_id = Number(facilityId);
            }

            const { data, error } = await db
                .from('facility_subscriptions')
                .insert(subscriptionData)
                .select('id')
                .single();

            if (error) return { persisted: false, error: `facility_subscriptions INSERT: ${error.message}` };
            subId = data?.id;
        }

        // 2. 결제이력 기록 (유료 플랜만) — 실패 시 subscription 롤백
        if (subId && amount > 0) {
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);

            const { error: payError } = await db
                .from('subscription_payments')
                .insert({
                    subscription_id: subId,
                    payment_context: 'facility',
                    portone_payment_id: portonePaymentId,
                    amount: amount,
                    final_amount: amount,
                    status: 'completed',
                    payment_method: 'card',
                    paid_at: now.toISOString(),
                    billing_period_start: now.toISOString().split('T')[0],
                    billing_period_end: periodEnd.toISOString().split('T')[0],
                });

            if (payError) {
                // 롤백: subscription을 이전 상태로 복원하거나 삭제
                if (wasInsert) {
                    await db.from('facility_subscriptions').delete().eq('id', subId);
                } else if (previousState) {
                    await db.from('facility_subscriptions').update({
                        plan_id: previousState.plan_id,
                        status: previousState.status,
                        next_billing_date: previousState.next_billing_date,
                        billing_cycle: previousState.billing_cycle,
                        updated_at: now.toISOString(),
                    }).eq('id', subId);
                }
                return { persisted: false, error: `subscription_payments INSERT 실패 → subscription 롤백 완료: ${payError.message}` };
            }
        }

        return { persisted: true, subscriptionId: subId ?? undefined };
    } catch (e) {
        return { persisted: false, error: e instanceof Error ? e.message : 'Unknown persistence error' };
    }
}

async function persistPersonalSubscription(
    db: SupabaseAdmin,
    userId: string,
    planId: string,
    portonePaymentId: string,
    amount: number,
): Promise<{ persisted: boolean; error?: string }> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    try {
        const { data: existingPayment } = await db
            .from('subscription_payments')
            .select('id')
            .eq('portone_payment_id', portonePaymentId)
            .limit(1)
            .maybeSingle();

        if (existingPayment) {
            return { persisted: true };
        }

        // 1. 기존 구독 조회 + 이전 상태 캡처 (롤백용)
        const { data: existing } = await db
            .from('user_subscriptions')
            .select('id, plan_id, plan_name, status, started_at, expires_at, billing_cycle')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

        const previousState = existing
            ? { plan_id: existing.plan_id, plan_name: existing.plan_name, status: existing.status, started_at: existing.started_at, expires_at: existing.expires_at, billing_cycle: existing.billing_cycle }
            : null;

        const subscriptionData: Record<string, unknown> = {
            plan_id: planId,
            plan_name: planId,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            billing_cycle: 'monthly',
        };

        const wasInsert = !existing;
        const existingId = existing?.id;

        if (existing) {
            const { error } = await db
                .from('user_subscriptions')
                .update(subscriptionData)
                .eq('id', existing.id);

            if (error) return { persisted: false, error: `user_subscriptions UPDATE: ${error.message}` };
        } else {
            subscriptionData.user_id = userId;

            const { data, error } = await db
                .from('user_subscriptions')
                .insert(subscriptionData)
                .select('id')
                .single();

            if (error) return { persisted: false, error: `user_subscriptions INSERT: ${error.message}` };
            // existingId를 방금 생성된 row로 업데이트 (삭제 롤백용)
            if (data?.id) {
                // TypeScript workaround: reassign is not possible for const, use variable
            }
        }

        // 2. 결제이력 기록 (유료 플랜만) — 실패 시 subscription 롤백
        if (amount > 0) {
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);

            const { error: payError } = await db
                .from('subscription_payments')
                .insert({
                    user_id: userId,
                    payment_context: 'personal',
                    portone_payment_id: portonePaymentId,
                    amount: amount,
                    final_amount: amount,
                    status: 'completed',
                    payment_method: 'card',
                    paid_at: now.toISOString(),
                    billing_period_start: now.toISOString().split('T')[0],
                    billing_period_end: periodEnd.toISOString().split('T')[0],
                });

            if (payError) {
                // 롤백: subscription을 이전 상태로 복원하거나 삭제
                if (wasInsert) {
                    await db.from('user_subscriptions').delete().eq('user_id', userId);
                } else if (previousState && existingId) {
                    await db.from('user_subscriptions').update({
                        plan_id: previousState.plan_id,
                        plan_name: previousState.plan_name,
                        status: previousState.status,
                        started_at: previousState.started_at,
                        expires_at: previousState.expires_at,
                        billing_cycle: previousState.billing_cycle,
                    }).eq('id', existingId);
                }
                return { persisted: false, error: `subscription_payments INSERT 실패 → subscription 롤백 완료: ${payError.message}` };
            }
        }

        return { persisted: true };
    } catch (e) {
        return { persisted: false, error: e instanceof Error ? e.message : 'Unknown persistence error' };
    }
}

// ============================================================
// 무료 전환 처리 (결제 없음 — service_role DB 직접 변경)
// ============================================================

async function handleFacilityFreeDowngrade(
    db: SupabaseAdmin,
    facilityId: string,
    verifiedUserId: string,
): Promise<{ persisted: boolean; error?: string }> {
    // 소유권 검증
    const owned = await verifyFacilityOwnership(db, facilityId, verifiedUserId);
    if (!owned) return { persisted: false, error: '시설 소유권 검증 실패' };

    const normalizedPlanId = normalizePlanId('FREE', 'facility');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(facilityId);
    const filterCol = isUUID ? 'facility_id_uuid' : 'facility_id_bigint';
    const filterVal = isUUID ? facilityId : Number(facilityId);

    const { data: existing } = await db
        .from('facility_subscriptions')
        .select('id')
        .eq(filterCol, filterVal)
        .limit(1)
        .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
        // 갱신 중단 예약: plan_id 유지, status='cancelling', auto_renew=false
        // next_billing_date까지 유료 권한 유지 → 만료 후 cron이 FREE 전환
        const { error } = await db
            .from('facility_subscriptions')
            .update({ status: 'cancelling', auto_renew: false, updated_at: now })
            .eq('id', existing.id);
        if (error) return { persisted: false, error: `facility cancelling UPDATE: ${error.message}` };
    }
    // 구독 row가 없으면 이미 무료 상태 — 성공으로 처리

    return { persisted: true };
}

async function handlePersonalFreeDowngrade(
    db: SupabaseAdmin,
    userId: string,
): Promise<{ persisted: boolean; error?: string }> {
    const { data: existing } = await db
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

    if (existing) {
        // 갱신 중단 예약: plan_id/plan_name 유지, status='cancelling', auto_renew=false
        // expires_at까지 유료 권한 유지 → 만료 후 cron/RPC가 FREE 전환
        const { error } = await db
            .from('user_subscriptions')
            .update({ status: 'cancelling', auto_renew: false })
            .eq('id', existing.id);
        if (error) return { persisted: false, error: `personal cancelling UPDATE: ${error.message}` };
    }
    // 구독 row가 없으면 이미 무료 상태 — 성공으로 처리

    return { persisted: true };
}

// ============================================================
// Main handler
// ============================================================

serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // ============================================================
    // [AUTH-14 FIX] 인증 검증 — Bearer 토큰 필수
    // ============================================================
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim() ?? '';
    if (!authHeader || !token || token === authHeader.trim()) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const { userId: verifiedUserId, error: authError } = await verifyJWT(token);
    if (authError || !verifiedUserId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const rateLimitResult = await rateLimit(req, {
        endpoint: 'verify-payment',
        maxRequests: 20,
        windowSeconds: 60,
        userId: verifiedUserId,
    });

    if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Retry-After': String(rateLimitResult.retryAfterSeconds ?? 60),
            },
        });
    }
    // ============================================================

    // Service role client for DB operations (created once, reused)
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );

    try {
        const {
            paymentId,
            expectedAmount,
            orderId,
            paymentContext,
            facilityId,
            planId,
            targetUserId,
            clientPaymentResult,
        } = await req.json();

        // ============================================================
        // 무료 전환 분기 (결제 없음 — PortOne 검증 스킵)
        // ============================================================
        if (paymentContext === 'facility_free_downgrade') {
            if (!facilityId) {
                return new Response(JSON.stringify({ verified: false, error: 'facilityId is required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
            const result = await handleFacilityFreeDowngrade(supabaseAdmin, facilityId, verifiedUserId);
            return new Response(JSON.stringify({ verified: true, ...result }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (paymentContext === 'personal_free_downgrade') {
            const result = await handlePersonalFreeDowngrade(supabaseAdmin, verifiedUserId);
            return new Response(JSON.stringify({ verified: true, ...result }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        // ============================================================

        const portoneApiSecret = Deno.env.get('PORTONE_API_SECRET');
        if (!portoneApiSecret) {
            return new Response(JSON.stringify({ error: 'PortOne API secret not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const paymentIntent = paymentId && (
            paymentContext === 'facility_subscription'
            || paymentContext === 'personal_subscription'
        )
            ? await getPaymentIntent(supabaseAdmin, paymentId)
            : null;

        const resolvedExpectedAmount = paymentIntent?.expected_amount ?? expectedAmount;

        if (!paymentId || typeof resolvedExpectedAmount !== 'number') {
            return new Response(JSON.stringify({ error: 'paymentId and expectedAmount are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // PortOne API로 결제 상태 조회
        const portoneResponse = await fetch(`${PORTONE_API_URL}/payments/${paymentId}`, {
            headers: {
                'Authorization': `PortOne ${portoneApiSecret}`,
                'Content-Type': 'application/json',
            },
        });

        if (!portoneResponse.ok) {
            await portoneResponse.text();
            await supabaseAdmin.from('system_logs').insert({
                level: 'ERROR',
                message: 'PortOne API error during payment verification',
                meta: {
                    paymentId,
                    status: portoneResponse.status,
                    requestedBy: verifiedUserId,
                },
                source: 'edge-function:verify-payment'
            });
            return new Response(JSON.stringify({
                verified: false,
                error: 'PortOne API error',
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const paymentData = await portoneResponse.json();
        const kcpReviewFields = normalizeKcpReviewFields({
            payment: paymentData,
            clientResult: clientPaymentResult as ClientPaymentResult | null,
            expectedAmount: resolvedExpectedAmount,
        });
        await upsertPaymentAudit(supabaseAdmin, {
            paymentId,
            paymentContext: paymentContext || "reservation",
            source: "edge-function:verify-payment",
            orderRef: orderId ?? null,
            reviewFields: kcpReviewFields,
        });
        if (kcpReviewFields.missingFields.length > 0) {
            await supabaseAdmin.from('system_logs').insert({
                level: 'WARN',
                message: 'KCP review fields incomplete during payment verification',
                meta: {
                    paymentId,
                    paymentContext: paymentContext || 'reservation',
                    missingFields: kcpReviewFields.missingFields,
                    resCd: kcpReviewFields.resCd,
                    tno: kcpReviewFields.tno,
                    payMethod: kcpReviewFields.payMethod,
                },
                source: 'edge-function:verify-payment'
            });
        }

        // 결제 금액 및 상태 검증
        const isAmountValid = paymentData.amount?.total === resolvedExpectedAmount;
        const isStatusValid = paymentData.status === 'PAID';

        if (!isAmountValid || !isStatusValid) {
            if (paymentIntent && (paymentData.status === 'FAILED' || paymentData.status === 'CANCELLED')) {
                await updatePaymentIntentStatus(
                    supabaseAdmin,
                    paymentId,
                    paymentData.status === 'FAILED' ? 'failed' : 'cancelled',
                    paymentData.status,
                );
            }
            // 위변조 감지 → DB에 기록
            await supabaseAdmin.from('system_logs').insert({
                level: 'ERROR',
                message: `결제 위변조 감지: paymentId=${paymentId}`,
                meta: {
                    expectedAmount: resolvedExpectedAmount,
                    actualAmount: paymentData.amount?.total,
                    status: paymentData.status,
                    orderId,
                    requestedBy: verifiedUserId,
                },
                source: 'edge-function:verify-payment'
            });

            return new Response(JSON.stringify({
                verified: false,
                error: '결제 금액 또는 상태가 일치하지 않습니다.',
                expected: resolvedExpectedAmount,
                actual: paymentData.amount?.total,
                paymentStatus: paymentData.status,
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ============================================================
        // [AUTH-14 FIX] orderId 소유권 검증 + 금액 이중 검증
        // ============================================================
        if (orderId) {
            // 1. 예약 조회 — 소유자와 금액 확인
            const { data: reservation, error: reservationError } = await supabaseAdmin
                .from('reservations')
                .select('user_id, payment_amount')
                .eq('id', orderId)
                .single();

            if (reservationError || !reservation) {
                await supabaseAdmin.from('system_logs').insert({
                    level: 'WARN',
                    message: `결제 검증 실패: 존재하지 않는 예약 orderId=${orderId}`,
                    meta: { paymentId, orderId, requestedBy: verifiedUserId },
                    source: 'edge-function:verify-payment'
                });

                return new Response(JSON.stringify({
                    verified: false,
                    error: '해당 예약을 찾을 수 없습니다.',
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // 2. 소유권 검증 — 예약의 user_id === 요청자의 Supabase Auth UID
            if (reservation.user_id !== verifiedUserId) {
                await supabaseAdmin.from('system_logs').insert({
                    level: 'ERROR',
                    message: `IDOR 시도 감지: 타인 예약에 결제 검증 시도`,
                    meta: {
                        paymentId,
                        orderId,
                        reservationOwner: reservation.user_id,
                        requestedBy: verifiedUserId,
                    },
                    source: 'edge-function:verify-payment'
                });

                return new Response(JSON.stringify({
                    verified: false,
                    error: '본인의 예약만 결제 검증이 가능합니다.',
                }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // 3. 금액 이중 검증 — DB 예약 금액과 요청 금액 일치 여부
            if (reservation.payment_amount != null && reservation.payment_amount !== resolvedExpectedAmount) {
                await supabaseAdmin.from('system_logs').insert({
                    level: 'ERROR',
                    message: `결제 금액 불일치: DB=${reservation.payment_amount}, 요청=${expectedAmount}`,
                    meta: {
                        paymentId,
                        orderId,
                        dbAmount: reservation.payment_amount,
                        requestedAmount: resolvedExpectedAmount,
                        requestedBy: verifiedUserId,
                    },
                    source: 'edge-function:verify-payment'
                });

                return new Response(JSON.stringify({
                    verified: false,
                    error: '예약 금액과 결제 요청 금액이 일치하지 않습니다.',
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // 4. 모든 검증 통과 → DB 업데이트
            await supabaseAdmin.from('reservations').update({
                payment_verified: true,
                payment_id: paymentId,
                paid_at: new Date().toISOString(),
            }).eq('id', orderId);
        }

        // ============================================================
        // 구독 결제: 검증 + DB 영속화 (service_role)
        // ============================================================
        if (paymentContext === 'facility_subscription') {
            const resolvedFacilityId = paymentIntent?.facility_id ?? facilityId;
            const resolvedPlanId = paymentIntent?.plan_id ?? planId;

            if (!resolvedFacilityId || !resolvedPlanId) {
                return new Response(JSON.stringify({
                    verified: false,
                    error: 'facilityId and planId are required for facility subscription verification.',
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const [planExists, facilityOwned] = await Promise.all([
                verifySubscriptionPlanExists(supabaseAdmin, resolvedPlanId),
                verifyFacilityOwnership(supabaseAdmin, resolvedFacilityId, verifiedUserId),
            ]);

            if (!planExists || !facilityOwned) {
                await supabaseAdmin.from('system_logs').insert({
                    level: 'ERROR',
                    message: 'Facility subscription verification rejected',
                    meta: {
                        paymentId,
                        facilityId: resolvedFacilityId,
                        planId: resolvedPlanId,
                        requestedBy: verifiedUserId,
                        planExists,
                        facilityOwned,
                    },
                    source: 'edge-function:verify-payment'
                });

                return new Response(JSON.stringify({
                    verified: false,
                    error: '시설 구독 결제 대상 검증에 실패했습니다.',
                }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // 검증 통과 → DB 영속화
            const persistResult = await persistFacilitySubscription(
                supabaseAdmin, resolvedFacilityId, resolvedPlanId, paymentId, resolvedExpectedAmount
            );

            if (!persistResult.persisted) {
                await supabaseAdmin.from('system_logs').insert({
                    level: 'ERROR',
                    message: 'Facility subscription persistence failed',
                    meta: { paymentId, facilityId: resolvedFacilityId, planId: resolvedPlanId, requestedBy: verifiedUserId },
                    source: 'edge-function:verify-payment'
                });

                return new Response(JSON.stringify({
                    verified: true,
                    persisted: false,
                    error: 'Payment verified but subscription activation failed',
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (paymentIntent) {
                await updatePaymentIntentStatus(supabaseAdmin, paymentId, 'paid', paymentData.status);
            }

            return new Response(JSON.stringify({
                verified: true,
                persisted: true,
                paymentId,
                amount: paymentData.amount?.total,
                status: paymentData.status,
                subscriptionId: persistResult.subscriptionId,
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (paymentContext === 'personal_subscription') {
            const resolvedTargetUserId = paymentIntent?.user_id ?? targetUserId;
            const resolvedPlanId = paymentIntent?.plan_id ?? planId;

            if (!resolvedTargetUserId || !resolvedPlanId) {
                return new Response(JSON.stringify({
                    verified: false,
                    error: 'targetUserId and planId are required for personal subscription verification.',
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const planExists = await verifySubscriptionPlanExists(supabaseAdmin, resolvedPlanId);
            const isOwner = resolvedTargetUserId === verifiedUserId;

            if (!planExists || !isOwner) {
                await supabaseAdmin.from('system_logs').insert({
                    level: 'ERROR',
                    message: 'Personal subscription verification rejected',
                    meta: {
                        paymentId,
                        planId: resolvedPlanId,
                        targetUserId: resolvedTargetUserId,
                        requestedBy: verifiedUserId,
                        planExists,
                        isOwner,
                    },
                    source: 'edge-function:verify-payment'
                });

                return new Response(JSON.stringify({
                    verified: false,
                    error: '개인 구독 결제 대상 검증에 실패했습니다.',
                }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // 검증 통과 → DB 영속화
            const persistResult = await persistPersonalSubscription(
                supabaseAdmin, verifiedUserId, resolvedPlanId, paymentId, resolvedExpectedAmount
            );

            if (!persistResult.persisted) {
                await supabaseAdmin.from('system_logs').insert({
                    level: 'ERROR',
                    message: 'Personal subscription persistence failed',
                    meta: { paymentId, planId: resolvedPlanId, targetUserId: verifiedUserId },
                    source: 'edge-function:verify-payment'
                });

                return new Response(JSON.stringify({
                    verified: true,
                    persisted: false,
                    error: 'Payment verified but subscription activation failed',
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (paymentIntent) {
                await updatePaymentIntentStatus(supabaseAdmin, paymentId, 'paid', paymentData.status);
            }

            return new Response(JSON.stringify({
                verified: true,
                persisted: true,
                paymentId,
                amount: paymentData.amount?.total,
                status: paymentData.status,
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ============================================================
        // 일반 결제 (예약 등) — 영속화 없이 검증만
        // ============================================================
        return new Response(JSON.stringify({
            verified: true,
            paymentId,
            amount: paymentData.amount?.total,
            status: paymentData.status,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: unknown) {
        console.error('internal error', error);

        return new Response(JSON.stringify({ error: 'Payment processing failed' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
