import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { rateLimit } from '../_shared/rateLimit.ts'

// ============================================================
// PortOne V2 환불 처리 Edge Function
//
// 역할: 서버에서 PortOne 취소 API를 호출하고 DB 상태를 갱신.
//
// 설계 원칙:
//   1. 클라이언트 직접 취소 API 호출 금지 → 이 함수 경유 필수
//   2. paymentId만 믿지 않음 → 내부 예약/주문 레코드 매칭 검증
//   3. 소유권/상태/중복 취소 방지 검증 후에만 실행
//   4. 자동 연결 보류 → 현재는 명시적 호출만 허용
// ============================================================

const PORTONE_API_URL = 'https://api.portone.io';

const PRODUCTION_ORIGINS = [
    'https://memorimap.kr',
    'https://www.memorimap.kr',
    'https://memorimap-app.vercel.app',
    'https://memorimap-app-ptys-projects.vercel.app',
    'https://memorimap.com',
    'https://www.memorimap.com',
];

const DEV_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];

const isDevMode = Deno.env.get('ENVIRONMENT') === 'development';
const ALLOWED_ORIGINS = isDevMode
    ? [...PRODUCTION_ORIGINS, ...DEV_ORIGINS]
    : PRODUCTION_ORIGINS;

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

type SupabaseAdmin = ReturnType<typeof createClient>;

// ============================================================
// JWT 검증 (verify-payment와 동일 패턴)
// ============================================================

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
        return { userId: null, error: e instanceof Error ? e.message : 'Token verification failed' };
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
        source: 'edge-function:process-refund',
    });
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
    // 인증 검증
    // ============================================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId: verifiedUserId, error: authError } = await verifyJWT(token);
    if (authError || !verifiedUserId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(req, {
        endpoint: 'process-refund',
        maxRequests: 10,
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

    const portoneApiSecret = Deno.env.get('PORTONE_API_SECRET');
    if (!portoneApiSecret) {
        return new Response(JSON.stringify({ error: 'PortOne API secret not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
        const { paymentId, reason, reservationId } = await req.json();

        if (!paymentId || !reservationId) {
            return new Response(JSON.stringify({ error: 'paymentId and reservationId are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ============================================================
        // 1. 내부 레코드 매칭 + 소유권 검증
        // ============================================================
        const { data: reservation, error: resError } = await db
            .from('reservations')
            .select('id, user_id, facility_id, payment_id, payment_amount, payment_verified, refund_status, status')
            .eq('id', reservationId)
            .single();

        if (resError || !reservation) {
            return new Response(JSON.stringify({ error: '해당 예약을 찾을 수 없습니다.' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // paymentId가 예약 레코드의 payment_id와 일치하는지 검증
        if (reservation.payment_id !== paymentId) {
            await log(db, 'ERROR', '환불 요청: paymentId 불일치', {
                requestedPaymentId: paymentId,
                actualPaymentId: reservation.payment_id,
                reservationId,
                requestedBy: verifiedUserId,
            });
            return new Response(JSON.stringify({ error: '결제 정보가 예약과 일치하지 않습니다.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 소유권 검증: 예약자 본인 또는 시설 관리자 또는 슈퍼관리자
        const isReservationOwner = reservation.user_id === verifiedUserId;

        let isFacilityAdmin = false;
        if (!isReservationOwner && reservation.facility_id) {
            const { data: facility } = await db
                .from('facilities')
                .select('user_id')
                .eq('id', reservation.facility_id)
                .maybeSingle();
            isFacilityAdmin = facility?.user_id === verifiedUserId;
        }

        let isSuperAdmin = false;
        if (!isReservationOwner && !isFacilityAdmin) {
            const { data: profile } = await db
                .from('profiles')
                .select('role')
                .eq('clerk_id', verifiedUserId)
                .maybeSingle();
            isSuperAdmin = profile?.role === 'super_admin';
        }

        if (!isReservationOwner && !isFacilityAdmin && !isSuperAdmin) {
            await log(db, 'ERROR', '환불 요청: 권한 없음', {
                reservationId,
                reservationOwner: reservation.user_id,
                requestedBy: verifiedUserId,
            });
            return new Response(JSON.stringify({ error: '환불 권한이 없습니다.' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ============================================================
        // 2. 상태 검증 — 중복 취소 방지
        // ============================================================
        if (!reservation.payment_verified) {
            return new Response(JSON.stringify({ error: '결제가 확인되지 않은 예약입니다.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (reservation.refund_status === 'completed') {
            return new Response(JSON.stringify({ error: '이미 환불이 완료된 예약입니다.' }), {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (reservation.refund_status === 'processing') {
            return new Response(JSON.stringify({ error: '환불이 이미 진행 중입니다.' }), {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ============================================================
        // 3. 낙관적 락: refund_status를 'processing'으로 전환
        // ============================================================
        const { error: lockError, count: lockCount } = await db
            .from('reservations')
            .update({ refund_status: 'processing' })
            .eq('id', reservationId)
            .in('refund_status', ['requested', 'failed'])
            .select('id', { count: 'exact', head: true });

        // refund_status가 null인 경우도 허용 (아직 환불 요청된 적 없는 건)
        if (lockCount === 0) {
            const { error: lockError2, count: lockCount2 } = await db
                .from('reservations')
                .update({ refund_status: 'processing' })
                .eq('id', reservationId)
                .is('refund_status', null)
                .select('id', { count: 'exact', head: true });

            if (lockError2 || (lockCount2 ?? 0) === 0) {
                return new Response(JSON.stringify({ error: '환불 처리 상태 전환에 실패했습니다. 현재 상태를 확인해주세요.' }), {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        if (lockError) {
            return new Response(JSON.stringify({ error: '환불 처리 상태 전환에 실패했습니다.' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ============================================================
        // 4. PortOne 취소 API 호출
        // ============================================================
        const cancelBody: Record<string, unknown> = {
            reason: reason || '관리자/사용자 환불 요청',
        };

        // 부분 환불이 아닌 전액 환불 (amount 미지정 시 전액)
        const portoneResponse = await fetch(`${PORTONE_API_URL}/payments/${paymentId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `PortOne ${portoneApiSecret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cancelBody),
        });

        if (!portoneResponse.ok) {
            await portoneResponse.text();

            // 실패 → refund_status를 'failed'로 복원
            await db
                .from('reservations')
                .update({ refund_status: 'failed' })
                .eq('id', reservationId);

            await log(db, 'ERROR', 'PortOne 취소 API 실패', {
                paymentId,
                reservationId,
                portoneStatus: portoneResponse.status,
                requestedBy: verifiedUserId,
            });

            return new Response(JSON.stringify({
                error: '환불 처리에 실패했습니다. 잠시 후 다시 시도하거나 고객센터에 문의해주세요.',
            }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const cancelResult = await portoneResponse.json();

        // ============================================================
        // 5. DB 반영: refund_status → 'completed'
        // ============================================================
        await db
            .from('reservations')
            .update({
                refund_status: 'completed',
                refund_reason: reason || '관리자/사용자 환불 요청',
            })
            .eq('id', reservationId);

        await log(db, 'INFO', '환불 처리 완료', {
            paymentId,
            reservationId,
            amount: reservation.payment_amount,
            reason,
            requestedBy: verifiedUserId,
            role: isSuperAdmin ? 'super_admin' : isFacilityAdmin ? 'facility_admin' : 'reservation_owner',
            portoneResult: cancelResult,
        });

        return new Response(JSON.stringify({
            success: true,
            paymentId,
            reservationId,
            refundStatus: 'completed',
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
