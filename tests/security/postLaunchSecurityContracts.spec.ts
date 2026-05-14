import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('post-launch payment security contracts', () => {
  it('uses the Memorimap service-role secret name with legacy fallback in Edge Functions', () => {
    const sources = [
      'supabase/functions/verify-payment/index.ts',
      'supabase/functions/register-payment-intent/index.ts',
      'supabase/functions/issue-billing-key/index.ts',
      'supabase/functions/charge-subscription/index.ts',
      'supabase/functions/payment-webhook/index.ts',
      'supabase/functions/process-refund/index.ts',
      'supabase/functions/_shared/rateLimit.ts',
    ].map(readRepoFile).join('\n');

    expect(sources).toContain('MEMORIMAP_SERVICE_ROLE_KEY');
    expect(sources).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('protects charge-subscription with a cron invocation secret when configured', () => {
    const source = readRepoFile('supabase/functions/charge-subscription/index.ts');

    expect(source).toContain('CHARGE_SUBSCRIPTION_CRON_SECRET');
    expect(source).toContain('CRON_SECRET');
    expect(source).toContain('const invocationSecret = cronSecret ?? serviceRoleKey;');
    expect(source).toContain('authHeader !== `Bearer ${invocationSecret}`');
  });

  it('binds reservation card payments to a pre-created orderId and cleans failed pending rows', () => {
    const source = readRepoFile('components/ReservationModal/useReservation.ts');

    expect(source).toContain('onCreatePendingReservation(pendingLegacy)');
    expect(source).toContain('orderId: pendingReservationId');
    expect(source).toContain("paymentContext: 'reservation'");
    expect(source).toContain('onCleanupPendingReservation(pendingReservationId)');
    expect(source).toContain('onFinalizePendingReservation(pendingReservationId)');
  });

  it('hides paid-required pending reservations until payment is verified', () => {
    const queries = readRepoFile('lib/queries.ts');
    const consultations = readRepoFile('components/dashboard/MyConsultations.tsx');

    expect(queries).toContain("item.status === 'pending'");
    expect(queries).toContain('Number(item.payment_amount ?? 0) > 0');
    expect(queries).toContain('item.payment_verified === false');
    expect(consultations).toContain("row.status === 'pending'");
    expect(consultations).toContain('Number(row.payment_amount ?? 0) > 0');
    expect(consultations).toContain('row.payment_verified === false');
  });
});
