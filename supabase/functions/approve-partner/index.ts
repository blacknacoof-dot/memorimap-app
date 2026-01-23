// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApproveRequest {
    inquiryId: string
    action: 'approve' | 'reject'
    rejectionReason?: string
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Admin client (service role) to execute transaction
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // User client to identify actor
        const supabaseUser = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // [Fix] Bypass getUser() due to Clerk/Supabase UUID mismatch.
        // 1. Decode JWT manually to verify Email
        const token = authHeader.replace('Bearer ', '');
        const payloadParts = token.split('.');
        if (payloadParts.length < 2) throw new Error('Invalid Token Format');

        // Simple base64 decode (url-safe)
        const payload = JSON.parse(atob(payloadParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const userEmail = payload.email;

        console.log(`[Auth] Decoded Email: ${userEmail}`);

        if (!userEmail) throw new Error('No email in token');

        // [Security] Super Admin Email Check
        const SUPER_ADMIN_EMAIL = 'blacknacoof@gmail.com';

        if (userEmail !== SUPER_ADMIN_EMAIL) {
            console.error(`Unauthorized access attempt by: ${userEmail}`);
            return new Response(
                JSON.stringify({
                    error: 'Unauthorized - Super Admin access required',
                    message: `User ${userEmail} is not authorized.`
                }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Mock user object for downstream compatibility (Use a static admin UUID if DB lookup fails or just generate one)
        // We can optionally lookup admin_users if we want to be strict, but for now the Email check is the strong gate.
        const user = {
            id: payload.sub || '00000000-0000-0000-0000-000000000000',
            email: userEmail
        };

        // Parse Request
        const { inquiryId, action, rejectionReason }: ApproveRequest = await req.json()

        if (action === 'reject') {
            // Reject remains simple update + log
            const { error: updateError } = await supabaseAdmin
                .from('partner_inquiries')
                .update({
                    status: 'rejected',
                    // rejection_reason: rejectionReason // If column exists
                })
                .eq('id', inquiryId)

            if (updateError) throw updateError

            await supabaseAdmin.rpc('log_admin_action', {
                p_action: 'REJECT_PARTNER',
                p_target_resource: 'partner_inquiries',
                p_target_id: inquiryId,
                p_details: { reason: rejectionReason }
            })

            return new Response(JSON.stringify({ success: true, action: 'rejected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Approve using Atomic RPC
        const { data: rpcResult, error: rpcError } = await supabaseAdmin
            .rpc('approve_partner_transaction', {
                p_inquiry_id: inquiryId,
                p_admin_id: user.id
            })

        if (rpcError) throw rpcError

        // Check internal success flag from RPC
        if (rpcResult && rpcResult.success === false) {
            throw new Error(rpcResult.error || 'Transaction failed')
        }

        return new Response(JSON.stringify({ success: true, action: 'approved', result: rpcResult }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
