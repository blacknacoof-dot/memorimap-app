import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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

async function logToDB(level: 'WARN' | 'ERROR', message: string, meta: Record<string, unknown> = {}) {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );

        await supabase.from('system_logs').insert({
            level,
            message,
            meta,
            source: 'edge-function:gemini-proxy'
        });
    } catch (error) {
        console.error('Failed to write gemini-proxy log', error);
    }
}

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
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim() ?? '';
    if (!authHeader || !token || token === authHeader.trim()) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const { userId, error: authError } = await verifyJWT(token);
    if (authError || !userId) {
        await logToDB('WARN', 'Gemini proxy auth failed', {
            error: authError || 'Unauthorized',
            hasAuthorizationHeader: Boolean(authHeader),
        });
        return new Response(JSON.stringify({ error: 'AI request failed' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const rateLimitResult = await rateLimit(req, {
        endpoint: 'gemini-proxy',
        maxRequests: 30,
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
            },
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
            ...(history || []).map((msg: { role: string; text: string }) => ({
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
            await logToDB('ERROR', 'Gemini upstream request failed', {
                userId,
                status: geminiResponse.status,
                upstreamError: errorText,
            });
            return new Response(JSON.stringify({ error: 'AI request failed' }), {
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
    } catch (error: unknown) {
        await logToDB('ERROR', 'Gemini proxy request failed', {
            userId,
            error: error instanceof Error ? error.message : 'Internal error',
        });
        return new Response(JSON.stringify({ error: 'AI request failed' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
