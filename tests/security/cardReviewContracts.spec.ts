import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('card review readiness contracts', () => {
  it('adds payment audit storage for KCP review fields', () => {
    const migration = readRepoFile('supabase/migrations/20260420193000_add_payment_audits_for_kcp_review.sql');

    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.payment_audits');
    expect(migration).toContain('res_cd TEXT');
    expect(migration).toContain('tno TEXT');
    expect(migration).toContain('app_no TEXT');
    expect(migration).toContain('card_cd TEXT');
    expect(migration).toContain('card_no TEXT');
    expect(migration).toContain('card_mny INTEGER');
  });

  it('normalizes and upserts KCP review fields from payment functions', () => {
    const helper = readRepoFile('supabase/functions/_shared/paymentAudit.ts');
    const verifyPayment = readRepoFile('supabase/functions/verify-payment/index.ts');
    const issueBillingKey = readRepoFile('supabase/functions/issue-billing-key/index.ts');
    const chargeSubscription = readRepoFile('supabase/functions/charge-subscription/index.ts');
    const webhook = readRepoFile('supabase/functions/payment-webhook/index.ts');

    expect(helper).toContain('res_cd');
    expect(helper).toContain('approvalNumber');
    expect(helper).toContain('payment_audits');
    expect(verifyPayment).toContain('upsertPaymentAudit');
    expect(issueBillingKey).toContain('upsertPaymentAudit');
    expect(chargeSubscription).toContain('upsertPaymentAudit');
    expect(webhook).toContain('upsertPaymentAudit');
  });

  it('documents reviewer login and production evidence requirements', () => {
    const checklist = readRepoFile('docs/04-report/card_review_readiness_checklist_20260420.md');
    const layout = readRepoFile('components/AppMainLayout.tsx');
    const footer = readRepoFile('components/WebBusinessFooter.tsx');

    expect(checklist).toContain('provide reviewer login accounts');
    expect(checklist).toContain('production KCP payment window');
    expect(checklist).toContain('payment_audits');
    expect(layout).toContain('MobileBusinessInfoBar');
    expect(footer).toContain('사업자등록번호');
    expect(footer).toContain('통신판매업신고번호');
  });
});
