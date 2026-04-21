import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('billing recovery contracts', () => {
  it('allows payment intents to persist sync_required as a recoverable state', () => {
    const migration = readRepoFile('supabase/migrations/20260420170000_expand_payment_intent_recovery_states.sql');

    expect(migration).toContain("DROP CONSTRAINT IF EXISTS payment_intents_status_check");
    expect(migration).toContain("'sync_required'");
  });

  it('stores initial activation verification failures as recoverable pending or sync_required states', () => {
    const source = readRepoFile('supabase/functions/issue-billing-key/index.ts');

    expect(source).toContain('await updatePaymentIntentStatus(db, paymentId, "pending", "VERIFY_PENDING")');
    expect(source).toContain('await updatePaymentIntentStatus(');
    expect(source).toContain('paymentId, "sync_required", "SYNC_REQUIRED"');
    expect(source).toContain('recoverable: true');
    expect(source).toContain('status: 202');
  });

  it('lets payment-webhook finalize pending or sync_required intents into a synced paid state', () => {
    const source = readRepoFile('supabase/functions/payment-webhook/index.ts');

    expect(source).toContain('status: "pending" | "sync_required" | "paid" | "failed" | "cancelled"');
    expect(source).toContain('await updatePaymentIntentStatus(db, paymentId, "sync_required", "SYNC_REQUIRED")');
    expect(source).toContain('await updatePaymentIntentStatus(db, paymentId, "paid", payment.status)');
    expect(source).toContain('return { action: `synced:${intent.payment_context}` };');
  });
});
