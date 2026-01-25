// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // allow all for compatibility, but can be targeted for production
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-auth, X-Clerk-Auth',
    'Access-Control-Allow-Credentials': 'true',
}

interface ApproveRequest {
    inquiryId: string
    action: 'approve' | 'reject'
    rejectionReason?: string
}

const RESEND_API_URL = 'https://api.resend.com/emails';

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
                from: '추모맵 <onboarding@resend.dev>', // Resend testing address
                to: [to],
                subject,
                html,
            }),
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error('Resend API Error:', errorData);
        } else {
            console.log(`Email sent successfully to ${to}`);
        }
    } catch (err) {
        console.error('Failed to send email:', err);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('x-clerk-auth') || req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Admin client (service role) to execute transaction
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )


        // [Fix] Decode JWT manually
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const payloadParts = token.split('.');
        if (payloadParts.length < 2) throw new Error('Invalid Token Format');
        const payload = JSON.parse(atob(payloadParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const userEmail = payload.email;

        if (!userEmail) throw new Error('No email in token');

        // [Security] Super Admin Email Check
        const SUPER_ADMIN_EMAIL = 'blacknacoof@gmail.com';
        if (userEmail !== SUPER_ADMIN_EMAIL) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders })
        }

        const user = {
            id: payload.sub || '00000000-0000-0000-0000-000000000000',
            email: userEmail
        };

        // Parse Request
        const { inquiryId, action, rejectionReason }: ApproveRequest = await req.json()

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
            const { error: updateError } = await supabaseAdmin
                .from('partner_inquiries')
                .update({ status: 'rejected' })
                .eq('id', inquiryId)

            if (updateError) throw updateError

            await supabaseAdmin.rpc('log_admin_action', {
                p_action: 'REJECT_PARTNER',
                p_target_resource: 'partner_inquiries',
                p_target_id: inquiryId,
                p_details: { reason: rejectionReason }
            })

            // 1. In-App Notification
            await supabaseAdmin.from('user_notifications').insert([{
                user_id: v_inquiry.user_id,
                title: '입점 신청 반려 안내',
                message: `신청하신 ${v_inquiry.company_name}의 입점 신청이 반려되었습니다. 사유: ${rejectionReason || '운영 정책 부적합'}`,
                type: 'warning'
            }])

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

        // 1. In-App Notification
        await supabaseAdmin.from('user_notifications').insert([{
            user_id: v_inquiry.user_id,
            title: '입점 신청 승인 완료',
            message: `축하합니다! ${v_inquiry.company_name}의 입점 신청이 승인되었습니다. 지금 바로 대시보드에서 시설 정보를 관리해보세요.`,
            type: 'success',
            link: '/dashboard'
        }])

        // 2. Email Notification
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
                            <a href="https://memorimap-app.vercel.app/#/facility-admin" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
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

        return new Response(JSON.stringify({ success: true, action: 'approved', result: rpcResult }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
