import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('billing ops contracts', () => {
  it('documents migration-first deployment and avoids db push in the recurring billing runbook', () => {
    const runbook = readRepoFile('docs/04-report/recurring_billing_ops_runbook_20260420.md');

    expect(runbook).toContain('20260420170000_expand_payment_intent_recovery_states.sql');
    expect(runbook).toContain('Do not use `supabase db push` for production');
    expect(runbook).toContain('issue-billing-key');
    expect(runbook).toContain('payment-webhook');
    expect(runbook).toContain('verify-payment');
    expect(runbook).toContain('charge-subscription');
    expect(runbook).toContain('reconcile-payment-intent');
  });

  it('provides executable production release commands and reconcile instructions', () => {
    const releaseDoc = readRepoFile('docs/04-report/recurring_billing_release_execution_20260420.md');

    expect(releaseDoc).toContain('xvmpvzldezpoxxsarizm');
    expect(releaseDoc).toContain('npx supabase functions deploy issue-billing-key --project-ref $projectRef --use-api');
    expect(releaseDoc).toContain('npx supabase functions deploy payment-webhook --project-ref $projectRef --use-api');
    expect(releaseDoc).toContain('reconcile-payment-intent');
    expect(releaseDoc).toContain("payment_intents.status = 'sync_required'");
    expect(releaseDoc).toContain('Invoke-RestMethod');
  });

  it('provides a service-role protected reconciliation function for recoverable payment intents', () => {
    const source = readRepoFile('supabase/functions/reconcile-payment-intent/index.ts');

    expect(source).toContain('authHeader !== `Bearer ${serviceRoleKey}`');
    expect(source).toContain('paymentId is required');
    expect(source).toContain('await updatePaymentIntentStatus(db, paymentId, "pending", payment.status || "VERIFY_PENDING")');
    expect(source).toContain('await updatePaymentIntentStatus(db, paymentId, "sync_required", "AMOUNT_MISMATCH")');
    expect(source).toContain('await updatePaymentIntentStatus(db, paymentId, "paid", payment.status)');
    expect(source).toContain('source: "edge-function:reconcile-payment-intent"');
  });
});
