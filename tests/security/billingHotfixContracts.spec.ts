import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('billing hotfix contracts', () => {
  it('routes client-side billing activation through redirect recovery markers', () => {
    const facilityPlans = readRepoFile('components/SubscriptionPlans.tsx');
    const personalPlans = readRepoFile('components/PersonalSubscriptionPlans.tsx');

    expect(facilityPlans).toContain('const redirectToBillingActivation = useCallback((billingKey: string) => {');
    expect(facilityPlans).toContain('redirectToBillingActivation(billingKeyResponse.billingKey);');
    expect(personalPlans).toContain('const redirectToBillingActivation = useCallback((billingKey: string) => {');
    expect(personalPlans).toContain('redirectToBillingActivation(billingKeyResponse.billingKey);');
  });

  it('guards issue-billing-key against recent duplicate activation attempts', () => {
    const source = readRepoFile('supabase/functions/issue-billing-key/index.ts');

    expect(source).toContain('async function findRecentActivationAttempt');
    expect(source).toContain('const duplicateWindowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();');
    expect(source).toContain('Duplicate recurring activation attempt blocked');
    expect(source).toContain('Activation already in progress');
  });

  it('pauses recurring auto-renew when charge persistence fails after a successful charge', () => {
    const source = readRepoFile('supabase/functions/charge-subscription/index.ts');

    expect(source).toContain('async function pauseFacilityAutoRenewForSync');
    expect(source).toContain('async function pauseUserAutoRenewForSync');
    expect(source).toContain('cancelled_reason: "billing_sync_required"');
    expect(source).toContain('updatePaymentIntentStatus(db, paymentId, "sync_required", "SYNC_REQUIRED")');
  });
});
