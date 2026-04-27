import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('edge function security contracts', () => {
  it('gemini-proxy hides upstream/auth details from external responses and applies rate limiting', () => {
    const source = readRepoFile('supabase/functions/gemini-proxy/index.ts');

    expect(source).toContain("import { rateLimit } from '../_shared/rateLimit.ts'");
    expect(source).toContain("endpoint: 'gemini-proxy'");
    expect(source).toContain("maxRequests: 30");
    expect(source).toContain("windowSeconds: 60");
    expect(source).toContain("JSON.stringify({ error: 'AI request failed' })");

    expect(source).not.toContain("details: authError");
    expect(source).not.toContain("details: errorText");
    expect(source).not.toContain("JSON.stringify({ error: 'Unauthorized', details:");
    expect(source).not.toContain("JSON.stringify({ error: 'Gemini API error', details:");
  });

  it('approve-partner removes raw body logging and applies rate limiting', () => {
    const source = readRepoFile('supabase/functions/approve-partner/index.ts');

    expect(source).toContain("import { rateLimit } from '../_shared/rateLimit.ts'");
    expect(source).toContain("endpoint: 'approve-partner'");
    expect(source).toContain("maxRequests: 10");
    expect(source).toContain("windowSeconds: 60");

    expect(source).toContain("inquiryId:");
    expect(source).toContain("action:");
    expect(source).toContain("error: 'VALIDATION_FAILED'");

    expect(source).not.toContain('{ body }');
    expect(source).not.toContain('meta: { body');
  });

  it('verify-payment applies rate limiting before business logic proceeds', () => {
    const source = readRepoFile('supabase/functions/verify-payment/index.ts');

    expect(source).toContain("import { rateLimit } from '../_shared/rateLimit.ts'");
    expect(source).toContain("endpoint: 'verify-payment'");
    expect(source).toContain("maxRequests: 20");
    expect(source).toContain("windowSeconds: 60");
    expect(source).toContain("status: 429");
    expect(source).toContain("'Retry-After'");
    expect(source).toContain("JSON.stringify({ error: 'Unauthorized' })");
    expect(source).toContain("message: 'PortOne API error during payment verification'");
    expect(source).not.toContain("JSON.stringify({ error: 'Unauthorized', details: authError })");
    expect(source).not.toContain("details: errorText");
  });

  it('register-payment-intent applies rate limiting before writing payment intents', () => {
    const source = readRepoFile('supabase/functions/register-payment-intent/index.ts');

    expect(source).toMatch(/import\s+\{\s*rateLimit\s*\}\s+from\s+['"]\.\.\/_shared\/rateLimit\.ts['"]/);
    expect(source).toMatch(/endpoint:\s*['"]register-payment-intent['"]/);
    expect(source).toContain("maxRequests: 20");
    expect(source).toContain("windowSeconds: 60");
    expect(source).toContain("status: 429");
    expect(source).toMatch(/['"]Retry-After['"]/);
    expect(source).toMatch(/\.from\(['"]payment_intents['"]\)/);
  });

  it('verify-payment handles free downgrade before requiring PortOne configuration', () => {
    const source = readRepoFile('supabase/functions/verify-payment/index.ts');
    const secretCheckIndex = source.indexOf("const portoneApiSecret = Deno.env.get('PORTONE_API_SECRET');");
    const freeDowngradeIndex = source.indexOf("if (paymentContext === 'facility_free_downgrade')");
    const personalDowngradeIndex = source.indexOf("if (paymentContext === 'personal_free_downgrade')");

    expect(freeDowngradeIndex).toBeGreaterThan(-1);
    expect(personalDowngradeIndex).toBeGreaterThan(-1);
    expect(secretCheckIndex).toBeGreaterThan(personalDowngradeIndex);
  });

  it('shared rate limit helper and backing migration exist', () => {
    const helper = readRepoFile('supabase/functions/_shared/rateLimit.ts');
    const migration = readRepoFile('supabase/migrations/20260330190000_edge_function_rate_limits.sql');
    const normalizedMigration = migration.toLowerCase();

    expect(helper).toContain('edge_function_rate_limits');
    expect(helper).toContain('export async function rateLimit');
    expect(helper).toContain('client_key');
    expect(helper).toContain('windowSeconds');

    expect(normalizedMigration).toContain('create table if not exists public.edge_function_rate_limits');
    expect(normalizedMigration).toContain('enable row level security');
    expect(normalizedMigration).toContain('service_role');
  });

  it('review upload hardening targets the production review-images bucket', () => {
    const migration = readRepoFile('supabase/migrations/20260330193000_fix_review_upload_policy_bucket.sql').toLowerCase();

    expect(migration).toContain('authenticated upload review-images');
    expect(migration).toContain("bucket_id = 'review-images'");
    expect(migration).toContain("^review-images/[a-z0-9-]+/[0-9]{13}_[a-f0-9]{8}_[a-z0-9-]+\\.(jpg|jpeg|png|webp)$");
    expect(migration).not.toContain("bucket_id = 'reviews'");
  });
});
