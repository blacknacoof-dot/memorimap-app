import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.22.4'
import { rateLimit } from '../_shared/rateLimit.ts'

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

const ApproveRequestSchema = z.object({
    inquiryId: z
        .union([z.string(), z.number()])
        .transform((val) => Number(val))
        .refine((val) => Number.isFinite(val), { message: 'inquiryId must be numeric' }),
    action: z.enum(['approve', 'reject']),
    rejectionReason: z.string().optional()
});

const RESEND_API_URL = 'https://api.resend.com/emails';

async function logToDB(supabase: ReturnType<typeof createClient>, level: 'INFO' | 'WARN' | 'ERROR', message: string, meta: Record<string, unknown> = {}) {
    try {
        await supabase.from('system_logs').insert({
            level,
            message,
            meta,
            source: 'edge-function:approve-partner'
        });
    } catch (e) {
        console.error('Failed to write to system_logs', e);
    }
}

async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
        console.warn('RESEND_API_KEY is not set. Skipping email.');
        return;
    }

    try {
        const res = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: '추모맵 <onboarding@resend.dev>',
                to: [to],
                subject,
                html,
            }),
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error('Resend API Error:', errorData);
        } else {
            console.warn(`Email sent successfully to ${to}`);
        }
    } catch (err) {
        console.error('Failed to send email:', err);
    }
}

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (!token || token === authHeader.trim()) {
            return new Response(JSON.stringify({ error: 'Invalid authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Admin client (service role) to execute transaction
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Verify JWT via Supabase Auth (native)
        const supabaseAuth = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            {
                global: { headers: { Authorization: `Bearer ${token}` } },
                auth: { autoRefreshToken: false, persistSession: false }
            }
        );
        const { data: { user: verifiedUser }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (!verifiedUser || authError) {
            throw new Error('Invalid or expired token');
        }

        const userEmail = verifiedUser.email;
        const userId = verifiedUser.id;

        if (!userEmail) throw new Error('No email in token');

        // [Security] Super Admin Role Check via DB (profiles 테이블 기준)
        const { data: adminCheck, error: adminCheckError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('clerk_id', userId)
            .eq('role', 'super_admin')
            .maybeSingle();

        if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: getCorsHeaders(req) })
        }

        const user = {
            id: userId,
            email: userEmail
        };

        const rateLimitResult = await rateLimit(req, {
            endpoint: 'approve-partner',
            maxRequests: 10,
            windowSeconds: 60,
            userId,
        });

        if (!rateLimitResult.allowed) {
            return new Response(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'Retry-After': String(rateLimitResult.retryAfterSeconds ?? 60),
                }
            })
        }

        // Parse and Validate Request with Zod
        const body = await req.json();
        const validationResult = ApproveRequestSchema.safeParse(body);

        if (!validationResult.success) {
            const errorMsg = `Validation failed: ${validationResult.error.errors.map(e => e.path + ': ' + e.message).join(', ')}`;
            const rawBody = body && typeof body === 'object' ? body as Record<string, unknown> : {};
            await logToDB(supabaseAdmin, 'WARN', errorMsg, {
                inquiryId: typeof rawBody.inquiryId === 'string' || typeof rawBody.inquiryId === 'number' ? rawBody.inquiryId : null,
                action: typeof rawBody.action === 'string' ? rawBody.action : null,
                error: 'VALIDATION_FAILED',
            });
            throw new Error(errorMsg);
        }

        const { inquiryId, action, rejectionReason } = validationResult.data;

        await logToDB(supabaseAdmin, 'INFO', `Processing partner request: ${action}`, { inquiryId, admin: user.email });

        // Fetch Inquiry Details for notifications
        const { data: v_inquiry, error: fetchError } = await supabaseAdmin
            .from('partner_inquiries')
            .select('*')
            .eq('id', inquiryId)
            .single()

        if (fetchError || !v_inquiry) throw new Error('Inquiry not found')

        // User email to send to (use their login email if company_email is missing)
        const recipientEmail = v_inquiry.company_email || v_inquiry.email;

        if (action === 'reject') {
            // [Fix] Update ALL pending inquiries for this company to 'rejected'
            const { error: updateError } = await supabaseAdmin
                .from('partner_inquiries')
                .update({
                    status: 'rejected',
                    message: `[System] Bulk rejected due to individual rejection. Reason: ${rejectionReason || '운영 정책 부적합'}`
                })
                .eq('company_name', v_inquiry.company_name)
                .eq('status', 'pending')

            if (updateError) throw updateError

            // Direct log insert
            await supabaseAdmin.from('audit_logs').insert([{
                user_id: user.id || 'SYSTEM',
                action: 'REJECT_PARTNER',
                resource_type: 'partner_inquiries',
                resource_id: inquiryId,
                metadata: {
                    actor_email: user.email,
                    reason: rejectionReason || '운영 정책 부적합',
                    bulk: true,
                    company_name: v_inquiry.company_name
                }
            }])

            // 1. In-App Notification
            if (v_inquiry.user_id) {
                await supabaseAdmin.from('user_notifications').insert([{
                    user_id: v_inquiry.user_id,
                    title: '입점 신청 반려 안내',
                    message: `신청하신 ${v_inquiry.company_name}의 입점 신청이 반려되었습니다. 사유: ${rejectionReason || '운영 정책 부적합'}`,
                    type: 'warning'
                }])
            } else {
                await logToDB(supabaseAdmin, 'WARN', 'Skipping user notification (missing inquiry.user_id)', {
                    inquiryId,
                    action: 'reject'
                });
            }

            // 2. Email Notification
            if (recipientEmail) {
                await sendEmail({
                    to: recipientEmail,
                    subject: `[추모맵] ${v_inquiry.company_name} 입점 신청 결과 안내`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #333;">안녕하세요, ${v_inquiry.company_name}님.</h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #555;">
                                귀하께서 신청하신 추모맵 파트너 입점 신청 결과에 대해 안내드립니다.
                            </p>
                            <div style="background-color: #fff4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; font-weight: bold; color: #d32f2f;">심사 결과: 반려</p>
                                <p style="margin: 5px 0 0 0; color: #333;"><strong>사유:</strong> ${rejectionReason || '운영 정책 부적합'}</p>
                            </div>
                            <p style="font-size: 14px; color: #777;">
                                관련하여 궁금하신 사항은 고객센터로 문의해 주시기 바랍니다.<br/>
                                감사합니다.
                            </p>
                        </div>
                    `
                });
            }

            return new Response(JSON.stringify({ success: true, action: 'rejected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Approve using Atomic RPC
        const { data: rpcResult, error: rpcError } = await supabaseAdmin
            .rpc('approve_partner_transaction', {
                p_inquiry_id: inquiryId,
                p_admin_id: user.id
            })

        if (rpcError) throw rpcError
        if (rpcResult && rpcResult.success === false) throw new Error(rpcResult.error || 'Transaction failed')

        // 동일업체 자동거절 + 인앱 알림은 RPC 내부(Step 5, Step 8)에서 처리됨
        // Edge Function에서는 이메일 발송만 담당

        // Email Notification
        if (recipientEmail) {
            await sendEmail({
                to: recipientEmail,
                subject: `[추모맵] ${v_inquiry.company_name} 입점 승인을 축하드립니다!`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #333;">안녕하세요, ${v_inquiry.company_name}님.</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #555;">
                            축하드립니다! 귀하의 추모맵 파트너 입점 신청이 성공적으로 승인되었습니다.
                        </p>
                        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; font-weight: bold; color: #0284c7; font-size: 18px;">심사 결과: 승인 완료</p>
                            <p style="margin: 10px 0 0 0; color: #555;">이제 추모맵에서 시설 정보를 관리하고 고객 상담을 받으실 수 있습니다.</p>
                        </div>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://memorimap.kr/#/facility-admin" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                어드민 대시보드 바로가기
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #777; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                            내 손안의 추모 비서, 추모맵과 함께해주셔서 감사합니다.
                        </p>
                    </div>
                `
            });
        }

        const approvalWarning = rpcResult && typeof rpcResult === 'object'
            ? (rpcResult as Record<string, unknown>).warning
            : undefined;

        return new Response(JSON.stringify({
            success: true,
            action: 'approved',
            warning: typeof approvalWarning === 'string' ? approvalWarning : undefined,
            result: rpcResult
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: unknown) {
        console.error('Edge Function Error:', error);

        try {
            const supabaseErrorClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
                { auth: { persistSession: false } }
            );
            await logToDB(supabaseErrorClient, 'ERROR', 'Edge Function Exception', {
                errorType: error instanceof Error ? error.name : typeof error,
            });
        } catch (logErr) {
            console.error('Failed to log error to DB', logErr);
        }

        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } })
    }
})
