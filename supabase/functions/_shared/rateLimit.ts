import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RateLimitOptions {
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
  userId?: string | null;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

function getClientKey(req: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim();
  if (forwardedFor) {
    return `ip:${forwardedFor}`;
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return `ip:${realIp}`;
  }

  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `ua:${userAgent}`;
}

export async function rateLimit(req: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return { allowed: true };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const clientKey = getClientKey(req, options.userId);
  const now = new Date();

  const { data: existing, error: selectError } = await supabase
    .from('edge_function_rate_limits')
    .select('request_count, window_started_at, lock_until')
    .eq('endpoint', options.endpoint)
    .eq('client_key', clientKey)
    .maybeSingle();

  if (selectError) {
    return { allowed: true };
  }

  const windowStart = existing?.window_started_at ? new Date(existing.window_started_at) : now;
  const lockUntil = existing?.lock_until ? new Date(existing.lock_until) : null;
  const windowExpired = now.getTime() - windowStart.getTime() >= options.windowSeconds * 1000;

  if (lockUntil && lockUntil.getTime() > now.getTime()) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((lockUntil.getTime() - now.getTime()) / 1000)),
    };
  }

  const nextCount = windowExpired ? 1 : (existing?.request_count ?? 0) + 1;
  const nextWindowStart = windowExpired ? now.toISOString() : (existing?.window_started_at ?? now.toISOString());
  const nextLockUntil = nextCount > options.maxRequests
    ? new Date(now.getTime() + options.windowSeconds * 1000).toISOString()
    : null;

  await supabase
    .from('edge_function_rate_limits')
    .upsert({
      endpoint: options.endpoint,
      client_key: clientKey,
      request_count: nextCount,
      window_started_at: nextWindowStart,
      lock_until: nextLockUntil,
      updated_at: now.toISOString(),
    }, { onConflict: 'endpoint,client_key' });

  if (nextLockUntil) {
    return {
      allowed: false,
      retryAfterSeconds: options.windowSeconds,
    };
  }

  return { allowed: true };
}
