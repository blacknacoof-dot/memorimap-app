import { expect, test, type Locator, type Page } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';
import { buildFacilitySubscriptionCriteria, getFacilitySubscriptionConflictTarget } from './highRisk.helpers';

const marker = `superadmin-subs-${Date.now()}`;

const ensureFacilityPlans = async () => {
  const { error } = await supabase.from('subscription_plans').upsert([
    {
      name: '무료',
      name_en: 'FREE',
      price: 0,
      sms_quota: 0,
      ai_chat_quota: 0,
      features: {},
    },
    {
      name: '프리미엄',
      name_en: 'PREMIUM',
      price: 299000,
      sms_quota: 0,
      ai_chat_quota: -1,
      features: {},
    },
  ], { onConflict: 'name_en' });

  if (error) {
    throw new Error(`Failed to seed facility subscription plans: ${error.message}`);
  }
};

const getSubscriptionMatch = (facilityId: string | number) => {
  const criteria = buildFacilitySubscriptionCriteria(String(facilityId));
  return criteria.column === 'facility_id_uuid'
    ? { facility_id_uuid: criteria.value, facility_id_bigint: null }
    : { facility_id_uuid: null, facility_id_bigint: criteria.value };
};

const seedSubscription = async (facilityId: string | number, facilityName: string) => {
  const match = getSubscriptionMatch(facilityId);
  const conflictTarget = getFacilitySubscriptionConflictTarget(String(facilityId));
  const nextBillingDate = new Date(Date.UTC(2026, 3, 30, 0, 0, 0)).toISOString();

  const { error } = await supabase
    .from('facility_subscriptions')
    .upsert({
      ...match,
      plan_id: 'PREMIUM',
      status: 'active',
      next_billing_date: nextBillingDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: conflictTarget });

  if (error) {
    throw new Error(`Failed to seed subscription for ${facilityName}: ${error.message}`);
  }
};

const clearSubscription = async (facilityId: string | number) => {
  const criteria = buildFacilitySubscriptionCriteria(String(facilityId));
  const existing = await supabase
    .from('facility_subscriptions')
    .select('id')
    .eq(criteria.column, criteria.value)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Failed to query subscription cleanup target: ${existing.error.message}`);
  }

  if (existing.data?.id) {
    await supabase.from('subscription_payments').delete().eq('subscription_id', existing.data.id);
  }

  const { error } = await supabase
    .from('facility_subscriptions')
    .delete()
    .eq(criteria.column, criteria.value);

  if (error) {
    throw new Error(`Failed to cleanup subscription state: ${error.message}`);
  }
};

const openSubscriptionTab = async (page: Page) => {
  await page.goto('/#/super-admin');
  await page.locator('header').getByRole('button').first().click();
  await page.getByRole('button', { name: '사업자 구독' }).click();
  await expect(page.locator('#subs-search')).toBeVisible({ timeout: 30000 });
};

const loginAsSuperAdmin = async (page: Page, email: string, password: string) => {
  await page.goto('/');
  const welcomeSheet = page.getByRole('dialog', { name: '추모맵 시작하기' });
  if (await welcomeSheet.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await expect(welcomeSheet).toBeHidden({ timeout: 10000 });
  }

  await page.evaluate(() => {
    window.dispatchEvent(new Event('open-login-modal'));
  });
  await expect(page.getByTestId('login-modal')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click({ force: true });
  await expect(page.getByTestId('login-modal')).toBeHidden({ timeout: 30000 });
};

const filterByFacilityName = async (page: Page, facilityName: string) => {
  const searchInput = page.locator('#subs-search');
  await searchInput.fill(facilityName);
  await expect
    .poll(async () => {
      return page.locator('div.p-4.flex.items-center.justify-between.hover\\:bg-slate-50').filter({ hasText: facilityName }).count();
    }, { timeout: 30000, intervals: [500, 1000, 2000] })
    .toBeGreaterThan(0);
};

const getSubscriptionRowLocator = (page: Page, facilityName: string): Locator => (
  page.locator('div.p-4.flex.items-center.justify-between.hover\\:bg-slate-50').filter({ hasText: facilityName }).first()
);

const updateBillingDateViaUi = async (page: Page, facilityName: string, nextDate: string) => {
  await filterByFacilityName(page, facilityName);
  const row = getSubscriptionRowLocator(page, facilityName);
  await expect(row).toBeVisible({ timeout: 30000 });
  await row.getByRole('button', { name: /결제 예정일/ }).click();
  await expect(page.getByTestId('prompt-modal')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('prompt-modal-input').fill(nextDate);
  await page.getByTestId('prompt-modal-yes').click();
  await expect(page.getByTestId('prompt-modal')).toBeHidden({ timeout: 10000 });
};

const expectBillingDateUpdated = async (facilityId: string | number, expectedDate: string) => {
  const criteria = buildFacilitySubscriptionCriteria(String(facilityId));
  await expect
    .poll(async () => {
      const { data, error } = await supabase
        .from('facility_subscriptions')
        .select('next_billing_date')
        .eq(criteria.column, criteria.value)
        .single();

      if (error) {
        throw new Error(`Failed to read updated billing date: ${error.message}`);
      }

      return String(data.next_billing_date || '').slice(0, 10);
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBe(expectedDate);
};

test.describe.serial('Super Admin Subscription Manager', () => {
  test.setTimeout(180000);

  let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
  let uuidFacilityId: string | null = null;
  let uuidFacilityName: string | null = null;
  let legacyFacilityId: string | null = null;
  let legacyFacilityName: string | null = null;
  let legacyFacilityNumericId: number | null = null;

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    await ensureFacilityPlans();

    uuidFacilityId = crypto.randomUUID();
    uuidFacilityName = `${marker}-uuid-facility`;
    legacyFacilityId = crypto.randomUUID();
    legacyFacilityName = `${marker}-legacy-facility`;
    legacyFacilityNumericId = 990000000 + Math.floor(Math.random() * 10000);

    const { error: uuidFacilityError } = await supabase.from('facilities').insert({
      id: uuidFacilityId,
      name: uuidFacilityName,
      type: 'funeral_home',
      verified: true,
      user_id: baseFixture.superAdminUser.id,
      address: '서울시 테스트로 101',
      latitude: 37.5665,
      longitude: 126.9780,
    });

    if (uuidFacilityError) {
      throw new Error(`Failed to create uuid facility fixture: ${uuidFacilityError.message}`);
    }

    const { error: legacyFacilityError } = await supabase.from('facilities').insert({
      id: legacyFacilityId,
      legacy_id: legacyFacilityNumericId,
      name: legacyFacilityName,
      type: 'columbarium',
      verified: true,
      user_id: baseFixture.superAdminUser.id,
      address: '서울시 테스트로 102',
      latitude: 37.5651,
      longitude: 126.9772,
    });

    if (legacyFacilityError) {
      throw new Error(`Failed to create legacy facility fixture: ${legacyFacilityError.message}`);
    }

    await clearSubscription(uuidFacilityId);
    await clearSubscription(String(legacyFacilityNumericId));
    await seedSubscription(uuidFacilityId, uuidFacilityName);
    await seedSubscription(String(legacyFacilityNumericId), legacyFacilityName);
  });

  test.afterAll(async () => {
    if (uuidFacilityId) {
      await clearSubscription(uuidFacilityId);
      await supabase.from('facilities').delete().eq('id', uuidFacilityId);
    }

    if (legacyFacilityNumericId !== null) {
      await clearSubscription(String(legacyFacilityNumericId));
    }

    if (legacyFacilityId) {
      await supabase.from('facilities').delete().eq('id', legacyFacilityId);
    }

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('updates next billing date for uuid and legacy facility subscriptions', async ({ page }) => {
    const admin = baseFixture!.superAdminUser;
    const uuidDate = '2026-05-15';
    const legacyDate = '2026-06-20';

    await loginAsSuperAdmin(page, admin.email, admin.password);
    await openSubscriptionTab(page);

    await updateBillingDateViaUi(page, uuidFacilityName!, uuidDate);
    await expectBillingDateUpdated(uuidFacilityId!, uuidDate);

    await openSubscriptionTab(page);
    await updateBillingDateViaUi(page, legacyFacilityName!, legacyDate);
    await expectBillingDateUpdated(String(legacyFacilityNumericId!), legacyDate);
  });
});
