import { expect, test, Page } from '@playwright/test';

import { supabase } from './db.utils';
import { loginViaUi, setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';
import {
  buildFacilitySubscriptionCriteria,
  createFacilityFixture,
  createHighRiskUser,
  deleteHighRiskUser,
  getFacilitySubscriptionConflictTarget,
  HighRiskUser,
  isUuidLike,
} from './highRisk.helpers';

type FacilitySubscriptionRow = {
  id: string;
  plan_id: string | null;
  status: string | null;
  facility_id_uuid: string | null;
  facility_id_bigint: number | null;
  next_billing_date: string | null;
};

const marker = `subscription-flow-${Date.now()}`;

let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
let facilityAdmin: HighRiskUser | null = null;
let targetFacility: { id: string; name: string; type: string } | null = null;

const stubPortone = async (page: Page) => {
  await page.route('**://cdn.portone.io/v2/browser-sdk.js*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.PortOne = { requestPayment: async (params) => ({ paymentId: params.paymentId }) };',
    });
  });

  await page.route('**/functions/v1/verify-payment*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ verified: true }),
    });
  });

  await page.addInitScript(() => {
    (window as typeof window & { PortOne?: { requestPayment: (params: { paymentId: string }) => Promise<{ paymentId: string }> } }).PortOne = {
      requestPayment: async (params: { paymentId: string }) => ({ paymentId: params.paymentId }),
    };
  });
};

const loginAsFacilityAdmin = async (page: Page, user: HighRiskUser) => {
  await loginViaUi(page, user.email, user.password);
  await page.goto('/#/facility-admin');
  await expect(page.locator('button.bg-gradient-to-r.from-purple-500.to-purple-600')).toBeVisible({ timeout: 30000 });
};

const openSubscriptionPlans = async (page: Page) => {
  await page.locator('button.bg-gradient-to-r.from-purple-500.to-purple-600').click();
  await expect(page.getByRole('heading', { name: '구독 플랜 설정' })).toBeVisible({ timeout: 30000 });
};

const PLAN_PRICES: Record<'free' | 'premium', number> = {
  free: 0,
  premium: 299000,
};

const getSubscriptionMatch = (facilityId: string) => {
  const criteria = buildFacilitySubscriptionCriteria(facilityId);
  return criteria.column === 'facility_id_uuid'
    ? { facility_id_uuid: criteria.value, facility_id_bigint: null, facility_id: null }
    : { facility_id_uuid: null, facility_id_bigint: criteria.value, facility_id: criteria.value };
};

const getSubscriptionRow = async (facilityId: string) => {
  const criteria = buildFacilitySubscriptionCriteria(facilityId);
  const { data, error } = await supabase
    .from('facility_subscriptions')
    .select('id, plan_id, status, facility_id_uuid, facility_id_bigint, next_billing_date')
    .eq(criteria.column, criteria.value)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read facility_subscriptions: ${error.message}`);
  }

  return data as FacilitySubscriptionRow | null;
};

const setFacilityPlan = async (facilityId: string, planId: 'FREE' | 'PREMIUM') => {
  const now = new Date();
  const nextDate = new Date(now);
  nextDate.setMonth(nextDate.getMonth() + 1);
  const match = getSubscriptionMatch(facilityId);
  const conflictTarget = getFacilitySubscriptionConflictTarget(facilityId);

  const { data: row, error } = await supabase
    .from('facility_subscriptions')
    .upsert({
      ...match,
      plan_id: planId,
      status: 'active',
      next_billing_date: nextDate.toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: conflictTarget })
    .select('id, plan_id, status, facility_id_uuid, facility_id_bigint, next_billing_date')
    .single();

  if (error || !row?.id) {
    throw new Error(`Failed to set facility plan (${planId}): ${error?.message || 'unknown error'}`);
  }

  if (planId === 'PREMIUM') {
    const { error: paymentError } = await supabase.from('subscription_payments').insert([{
      subscription_id: row.id,
      amount: PLAN_PRICES.premium,
      final_amount: PLAN_PRICES.premium,
      status: 'completed',
      payment_method: 'card',
      paid_at: now.toISOString(),
    }]);

    if (paymentError) {
      throw new Error(`Failed to create premium payment row: ${paymentError.message}`);
    }
  }

  return row;
};

const clearSubscriptionState = async (facilityId: string) => {
  const criteria = buildFacilitySubscriptionCriteria(facilityId);
  const existing = await supabase
    .from('facility_subscriptions')
    .select('id')
    .eq(criteria.column, criteria.value)
    .maybeSingle();

  if (existing.data?.id) {
    await supabase.from('subscription_payments').delete().eq('subscription_id', existing.data.id);
  }
  await supabase.from('facility_subscriptions').delete().eq(criteria.column, criteria.value);
};

test.describe.serial('High risk flow: subscription', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    facilityAdmin = await createHighRiskUser('facility_admin', marker);
    targetFacility = await createFacilityFixture({
      ownerId: facilityAdmin.id,
      name: `${marker} Admin Facility`,
      type: 'funeral_home',
      verified: true,
      address: '서울 강남구 E2E 테스트로 100',
    });

    await clearSubscriptionState(targetFacility.id);
    await supabase.from('user_notifications').delete().eq('user_id', baseFixture.superAdminUser.id);
    await supabase.from('user_notifications').delete().eq('user_id', facilityAdmin.id);
  });

  test.afterAll(async () => {
    if (targetFacility) {
      await clearSubscriptionState(targetFacility.id);
      await supabase.from('facilities').delete().eq('id', targetFacility.id);
    }

    if (facilityAdmin) {
      await deleteHighRiskUser(facilityAdmin.id);
    }

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('S-1: free -> premium -> free keeps canonical plan_id and a single subscription row', async ({ page }) => {
    const admin = facilityAdmin!;
    const facility = targetFacility!;

    await loginAsFacilityAdmin(page, admin);
    await expect(page.getByRole('heading', { name: facility.name })).toBeVisible({ timeout: 30000 });

    await openSubscriptionPlans(page);
    const planCards = page.locator('div.group.relative.bg-white.rounded-2xl');

    await setFacilityPlan(facility.id, 'FREE');
    await expect(planCards.first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('heading', { name: '무료체험' })).toBeVisible({ timeout: 30000 });

    let row = await getSubscriptionRow(facility.id);
    expect(row).toBeTruthy();
    expect(row!.plan_id).toBe('FREE');
    expect(row!.status).toBe('active');
    expect(row!.facility_id_uuid).toBe(isUuidLike(facility.id) ? facility.id : null);
    expect(row!.facility_id_bigint).toBe(isUuidLike(facility.id) ? null : Number(facility.id));

    await page.reload();
    await expect(page.locator('button.bg-gradient-to-r.from-purple-500.to-purple-600')).toBeVisible({ timeout: 30000 });
    await openSubscriptionPlans(page);
    await expect(planCards.nth(0)).toBeVisible({ timeout: 30000 });

    await setFacilityPlan(facility.id, 'FREE');
    await page.reload();
    await expect(page.locator('button.bg-gradient-to-r.from-purple-500.to-purple-600')).toBeVisible({ timeout: 30000 });
    await openSubscriptionPlans(page);
    await expect(planCards.nth(0)).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('heading', { name: '무료체험' })).toBeVisible({ timeout: 30000 });

    await setFacilityPlan(facility.id, 'PREMIUM');
    await expect.poll(async () => (await getSubscriptionRow(facility.id))?.plan_id ?? null, {
      timeout: 30000,
      intervals: [1000, 2000],
    }).toBe('PREMIUM');

    row = await getSubscriptionRow(facility.id);
    expect(row).toBeTruthy();
    expect(row!.plan_id).toBe('PREMIUM');
    expect(row!.status).toBe('active');

    const { count: premiumPaymentCount, error: paymentCountError } = await supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', row!.id);

    expect(paymentCountError).toBeNull();
    expect(premiumPaymentCount).toBe(1);

    await page.reload();
    await expect(page.locator('button.bg-gradient-to-r.from-purple-500.to-purple-600')).toBeVisible({ timeout: 30000 });
    await openSubscriptionPlans(page);
    await expect(planCards.nth(2)).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('heading', { name: '프리미엄' })).toBeVisible({ timeout: 30000 });

    await setFacilityPlan(facility.id, 'FREE');

    await expect.poll(async () => (await getSubscriptionRow(facility.id))?.plan_id ?? null, {
      timeout: 30000,
      intervals: [1000, 2000],
    }).toBe('FREE');

    row = await getSubscriptionRow(facility.id);
    expect(row).toBeTruthy();
    expect(row!.plan_id).toBe('FREE');
    expect(row!.status).toBe('active');

    const subscriptionCriteria = buildFacilitySubscriptionCriteria(facility.id);
    const { count: subscriptionCount, error: subscriptionCountError } = await supabase
      .from('facility_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq(subscriptionCriteria.column, subscriptionCriteria.value);

    expect(subscriptionCountError).toBeNull();
    expect(subscriptionCount).toBe(1);

    const { count: paymentCountFinal, error: paymentCountFinalError } = await supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', row!.id);

    expect(paymentCountFinalError).toBeNull();
    expect(paymentCountFinal).toBe(1);
  });

  test('S-2: selecting the current plan again is a no-op', async ({ page }) => {
    const admin = facilityAdmin!;
    const facility = targetFacility!;

    await loginAsFacilityAdmin(page, admin);
    await openSubscriptionPlans(page);

    await setFacilityPlan(facility.id, 'FREE');
    await setFacilityPlan(facility.id, 'FREE');

    const criteria = buildFacilitySubscriptionCriteria(facility.id);
    const beforeCount = await supabase
      .from('facility_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq(criteria.column, criteria.value);

    expect(beforeCount.error).toBeNull();
    expect(beforeCount.count).toBe(1);

    const afterRow = await getSubscriptionRow(facility.id);
    expect(afterRow?.plan_id).toBe('FREE');
  });
});
