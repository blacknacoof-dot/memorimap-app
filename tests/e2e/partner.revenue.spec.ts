import { expect, test, Page } from '@playwright/test';

import { supabase } from './db.utils';
import { loginViaUi, setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';
import {
  buildFacilitySubscriptionCriteria,
  createFacilityFixture,
  createHighRiskUser,
  createSangjoAdminLink,
  getFacilitySubscriptionConflictTarget,
  HighRiskUser,
} from './highRisk.helpers';

const marker = `partner-revenue-${Date.now()}`;
const SJ_STARTER = 'SJ_STARTER';
const SJ_PROFESSIONAL = 'SJ_PROFESSIONAL';
const SJ_ENTERPRISE = 'SJ_ENTERPRISE';
const ensureSangjoPlans = async () => {
  const plans = [
    {
      name: '상조 STARTER',
      name_en: 'SJ_STARTER',
      price: 3000000,
      sms_quota: 0,
      ai_chat_quota: -1,
      features: {
        ai_consult: true,
        auto_closing: true,
        coupon: '300000',
        report: 'basic',
        priority: 'normal',
      },
    },
    {
      name: '상조 PROFESSIONAL',
      name_en: 'SJ_PROFESSIONAL',
      price: 8000000,
      sms_quota: 0,
      ai_chat_quota: -1,
      features: {
        ai_consult: true,
        crm: 'advanced',
        dashboard: 'realtime',
        cs: 'dedicated',
        report: 'weekly',
        priority: 'high',
      },
    },
    {
      name: '상조 ENTERPRISE',
      name_en: 'SJ_ENTERPRISE',
      price: 15000000,
      sms_quota: 0,
      ai_chat_quota: -1,
      features: {
        ai_consult: true,
        banner: 'exclusive',
        auto_contract: true,
        manager: 'dedicated',
        custom_branding: true,
        api: true,
        report: 'custom',
        priority: 'top',
      },
    },
  ];

  const { error } = await supabase.from('subscription_plans').upsert(
    plans.map((plan) => ({
      ...plan,
      features: plan.features,
    })),
    { onConflict: 'name_en' },
  );

  if (error) {
    throw new Error(`Failed to seed sangjo subscription plans: ${error.message}`);
  }
};

let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
let sangjoAdmin: HighRiskUser | null = null;
let sangjoFacility: { id: string; name: string; type: string } | null = null;

const getSubscriptionMatch = (facilityId: string) => {
  const criteria = buildFacilitySubscriptionCriteria(facilityId);
  return criteria.column === 'facility_id_uuid'
    ? { facility_id_uuid: criteria.value, facility_id_bigint: null, facility_id: null }
    : { facility_id_uuid: null, facility_id_bigint: criteria.value, facility_id: criteria.value };
};

const clickButtonByName = async (page: Page, name: string) => {
  const button = page.getByRole('button', { name });
  await button.evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
};

const openSangjoRevenueTab = async (page: Page) => {
  await clickButtonByName(page, '상조 대시보드');
  await expect(page.getByRole('button', { name: '요금제 관리' })).toBeVisible({ timeout: 30000 });
  await clickButtonByName(page, '요금제 관리');
};

const seedConsultations = async (facilityId: string, userId: string) => {
  await Promise.all(Array.from({ length: 20 }, async (_, idx) => {
    const { error } = await supabase.from('consultations').insert({
      facility_id: facilityId,
      user_id: userId,
      user_name: `Partner Seed ${idx + 1}`,
      user_phone: `010-0000-${String(idx + 1).padStart(4, '0')}`,
      status: 'waiting',
      notes: 'partner revenue seed',
      category: 'sangjo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to seed consultation row: ${error.message}`);
    }
  }));
};

const setSangjoPlan = async (facilityId: string, planId: typeof SJ_STARTER | typeof SJ_PROFESSIONAL | typeof SJ_ENTERPRISE) => {
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
    .select('id, plan_id, status')
    .single();

  if (error || !row?.id) {
    throw new Error(`Failed to set sangjo plan (${planId}): ${error?.message || 'unknown error'}`);
  }

  if (planId !== SJ_STARTER) {
    const { error: paymentError } = await supabase.from('subscription_payments').insert([{
      subscription_id: row.id,
      amount: planId === SJ_PROFESSIONAL ? 8000000 : 15000000,
      final_amount: planId === SJ_PROFESSIONAL ? 8000000 : 15000000,
      status: 'completed',
      payment_method: 'card',
      paid_at: now.toISOString(),
    }]);

    if (paymentError) {
      throw new Error(`Failed to create sangjo payment row: ${paymentError.message}`);
    }
  }

  return row;
};

const getSubscriptionRow = async (facilityId: string) => {
  const criteria = buildFacilitySubscriptionCriteria(facilityId);
  const { data, error } = await supabase
    .from('facility_subscriptions')
    .select('id, plan_id, status, facility_id_uuid, facility_id_bigint')
    .eq(criteria.column, criteria.value)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read facility_subscriptions: ${error.message}`);
  }

  return data;
};

const clearSangjoState = async (facilityId: string, adminId?: string) => {
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
  await supabase.from('consultations').delete().eq('facility_id', facilityId);
  await supabase.from('reservations').delete().eq('facility_id', facilityId);
  await supabase.from('sangjo_contracts').delete().eq('sangjo_id', facilityId);
  if (adminId) {
    await supabase.from('sangjo_dashboard_users').delete().eq('id', adminId);
    await supabase.from('sangjo_hq_admins').delete().eq('user_id', adminId);
  }
};

test.describe.serial('High risk flow: partner revenue', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    sangjoAdmin = await createHighRiskUser('sangjo_hq_admin', marker);
    sangjoFacility = await createFacilityFixture({
      ownerId: sangjoAdmin.id,
      name: `${marker} Sangjo`,
      type: 'sangjo',
      verified: true,
      address: '서울 송파구 E2E 테스트로 200',
    });

    await ensureSangjoPlans();
    await clearSangjoState(sangjoFacility.id, sangjoAdmin.id);
    await createSangjoAdminLink({
      userId: sangjoAdmin.id,
      sangjoId: sangjoFacility.id,
      companyName: sangjoFacility.name,
    });
    await setSangjoPlan(sangjoFacility.id, SJ_STARTER);
    await supabase.from('user_notifications').delete().eq('user_id', baseFixture.superAdminUser.id);
    await seedConsultations(sangjoFacility.id, sangjoAdmin.id);
  });

  test.afterAll(async () => {
    if (sangjoFacility) {
      await clearSangjoState(sangjoFacility.id, sangjoAdmin?.id);
      await supabase.from('facilities').delete().eq('id', sangjoFacility.id);
    }

    if (sangjoAdmin) {
      await supabase.from('profiles').delete().eq('clerk_id', sangjoAdmin.id);
      await supabase.auth.admin.deleteUser(sangjoAdmin.id);
    }

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('R-1: starter dashboard shows upgrade banner, simulator, and active plan', async ({ page }) => {
    const admin = sangjoAdmin!;
    await loginViaUi(page, admin.email, admin.password);

    await openSangjoRevenueTab(page);
    await page.getByRole('button', { name: '요금제 변경' }).click();
    await expect(page.getByRole('heading', { name: '파일럿', exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.locator('input[type="range"]').first()).toBeVisible({ timeout: 30000 });
  });

  test('R-2: upgrading to enterprise updates DB and removes starter-only simulator UI', async ({ page }) => {
    const admin = sangjoAdmin!;
    const facility = sangjoFacility!;

    await loginViaUi(page, admin.email, admin.password);
    await openSangjoRevenueTab(page);

    await setSangjoPlan(facility.id, SJ_ENTERPRISE);

    await expect.poll(async () => (await getSubscriptionRow(facility.id))?.plan_id ?? null, {
      timeout: 30000,
      intervals: [1000, 2000],
    }).toBe(SJ_ENTERPRISE);

    const subscriptionRow = await getSubscriptionRow(facility.id);
    expect(subscriptionRow).toBeTruthy();
    expect(subscriptionRow!.plan_id).toBe(SJ_ENTERPRISE);
    expect(subscriptionRow!.status).toBe('active');

    const { count: paymentCount, error: paymentCountError } = await supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subscriptionRow!.id);

    expect(paymentCountError).toBeNull();
    expect(paymentCount).toBe(1);

    await page.reload();
    await openSangjoRevenueTab(page);
    await expect(page.locator('input[type="range"]')).toHaveCount(0, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: '엔터프라이즈' }).first()).toBeVisible({ timeout: 30000 });
  });
});
