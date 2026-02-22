// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
    'https://memorimap-app.vercel.app',
    'https://memorimap.com',
    'https://www.memorimap.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

const getCorsHeaders = (req: Request) => {
    const origin = req.headers.get('origin');
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Credentials': 'true',
    };
};

/**
 * [AUTH-14 FIX] JWT 검증 — PostgREST를 통한 서명 검증
 * Clerk JWT → Supabase에 전달 → PostgREST가 JWT 서명 검증 → clerk_user_id() RPC 호출
 * 유효하지 않은 JWT는 PostgREST 단에서 거부됨
 */
async function verifyJWT(token: string): Promise<{ userId: string | null; error: string | null }> {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
        return { userId: null, error: 'Supabase not configured' };
    }

    try {
        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: clerkId, error: rpcError } = await supabaseUser.rpc('clerk_user_id');

        if (rpcError || !clerkId) {
            return { userId: null, error: rpcError?.message || 'Invalid or expired token' };
        }

        return { userId: clerkId, error: null };
    } catch (e) {
        return { userId: null, error: e.message || 'Token verification failed' };
    }
}

const PORTONE_API_URL = 'https://api.portone.io/v2';

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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId: verifiedUserId, error: authError } = await verifyJWT(token);
    if (authError || !verifiedUserId) {
        return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), {
            status: 401,
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

    // Service role client for DB operations (created once, reused)
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );

    try {
        const { paymentId, expectedAmount, orderId } = await req.json();

        if (!paymentId || !expectedAmount) {
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
            const errorText = await portoneResponse.text();
            return new Response(JSON.stringify({
                verified: false,
                error: 'PortOne API error',
                details: errorText
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const paymentData = await portoneResponse.json();

        // 결제 금액 및 상태 검증
        const isAmountValid = paymentData.amount?.total === expectedAmount;
        const isStatusValid = paymentData.status === 'PAID';

        if (!isAmountValid || !isStatusValid) {
            // 위변조 감지 → DB에 기록
            await supabaseAdmin.from('system_logs').insert({
                level: 'ERROR',
                message: `결제 위변조 감지: paymentId=${paymentId}`,
                meta: {
                    expectedAmount,
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
                expected: expectedAmount,
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

            // 2. 소유권 검증 — 예약의 user_id === 요청자의 Clerk ID
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
            if (reservation.payment_amount != null && reservation.payment_amount !== expectedAmount) {
                await supabaseAdmin.from('system_logs').insert({
                    level: 'ERROR',
                    message: `결제 금액 불일치: DB=${reservation.payment_amount}, 요청=${expectedAmount}`,
                    meta: {
                        paymentId,
                        orderId,
                        dbAmount: reservation.payment_amount,
                        requestedAmount: expectedAmount,
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

        return new Response(JSON.stringify({
            verified: true,
            paymentId,
            amount: paymentData.amount?.total,
            status: paymentData.status,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
