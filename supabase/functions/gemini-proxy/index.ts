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

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent';

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

    // Auth verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId, error: authError } = await verifyJWT(token);
    if (authError || !userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const apiKey = Deno.env.get('GOOGLE_GENAI_API_KEY');
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const { history, message, systemPrompt } = await req.json();

        if (!message || typeof message !== 'string') {
            return new Response(JSON.stringify({ error: 'message is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt || '' }] },
            ...(history || []).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}&alt=sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                    responseMimeType: 'application/json',
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
            }),
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            return new Response(JSON.stringify({ error: 'Gemini API error', details: errorText }), {
                status: geminiResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // SSE 스트림을 클라이언트로 프록시
        return new Response(geminiResponse.body, {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
