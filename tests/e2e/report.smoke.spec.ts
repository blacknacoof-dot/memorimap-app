import { expect, test } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';
import {
  buildFacilitySubscriptionCriteria,
  createFacilityFixture,
  createHighRiskUser,
  createSangjoAdminLink,
  getFacilitySubscriptionConflictTarget,
  type HighRiskUser,
} from './highRisk.helpers';
import { handleSendMonthlyReportRequest } from '../../supabase/functions/send-monthly-report/core';

const marker = `report-smoke-${Date.now()}`;
const SJ_STARTER = 'SJ_STARTER';

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

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for report smoke tests');
}

const getSubscriptionMatch = (facilityId: string) => {
  const criteria = buildFacilitySubscriptionCriteria(facilityId);
  return criteria.column === 'facility_id_uuid'
    ? { facility_id_uuid: criteria.value, facility_id_bigint: null, facility_id: null }
    : { facility_id_uuid: null, facility_id_bigint: criteria.value, facility_id: criteria.value };
};

const callReportFunction = async (
  authorization: string,
  extraHeaders?: Record<string, string>,
) => {
  const request = new Request('http://localhost/functions/v1/send-monthly-report', {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
      ...(extraHeaders ?? {}),
    },
  });

  const response = await handleSendMonthlyReportRequest(request, supabase as never, {
    serviceRoleKey,
    dryRun: true,
  });

  const text = await response.text();
  let body: Record<string, unknown> | null = null;
  try {
    body = text ? JSON.parse(text) as Record<string, unknown> : null;
  } catch {
    body = { raw: text };
  }

  return { response, body };
};

const seedActiveSubscription = async (facilityId: string) => {
  await supabase.from('facility_subscriptions').upsert({
    ...getSubscriptionMatch(facilityId),
    plan_id: SJ_STARTER,
    status: 'active',
    next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: getFacilitySubscriptionConflictTarget(facilityId) });
};

test.describe.serial('High risk flow: report smoke', () => {
  test.setTimeout(180000);

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    sangjoAdmin = await createHighRiskUser('sangjo_hq_admin', marker);
    sangjoFacility = await createFacilityFixture({
      ownerId: sangjoAdmin.id,
      name: `${marker} Sangjo`,
      type: 'sangjo',
      verified: true,
      address: '서울시 서초구 E2E 테스트로 300',
    });

    await createSangjoAdminLink({
      userId: sangjoAdmin.id,
      sangjoId: sangjoFacility.id,
      companyName: sangjoFacility.name,
    });

    await ensureSangjoPlans();
    const criteria = buildFacilitySubscriptionCriteria(sangjoFacility.id);
    await supabase.from('facility_subscriptions').delete().eq(criteria.column, criteria.value);
    await supabase.from('consultations').delete().eq('facility_id', sangjoFacility.id);
    await supabase.from('reservations').delete().eq('facility_id', sangjoFacility.id);
    await supabase.from('sangjo_contracts').delete().eq('sangjo_id', sangjoFacility.id);
  });

  test.afterAll(async () => {
    if (sangjoFacility) {
      const criteria = buildFacilitySubscriptionCriteria(sangjoFacility.id);
      await supabase.from('facility_subscriptions').delete().eq(criteria.column, criteria.value);
      await supabase.from('consultations').delete().eq('facility_id', sangjoFacility.id);
      await supabase.from('reservations').delete().eq('facility_id', sangjoFacility.id);
      await supabase.from('sangjo_contracts').delete().eq('sangjo_id', sangjoFacility.id);
      await supabase.from('sangjo_dashboard_users').delete().eq('id', sangjoAdmin?.id);
      await supabase.from('sangjo_hq_admins').delete().eq('user_id', sangjoAdmin?.id);
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

  test('RPT-1: unauthorized requests are rejected with 401', async () => {
    const { response, body } = await callReportFunction('Bearer invalid-token', { 'x-vercel-cron': '1' });
    expect(response.status).toBe(401);
    expect(body).toMatchObject({ error: 'Unauthorized' });
  });

  test('RPT-2: non-cron calls are rejected before service role check', async () => {
    const { response, body } = await callReportFunction(`Bearer ${serviceRoleKey}`);
    expect(response.status).toBe(403);
    expect(body).toMatchObject({ error: 'Forbidden: cron invocation only' });
  });

  test('RPT-3: cron-authorized calls enter the report execution path', async () => {
    const { response, body } = await callReportFunction(`Bearer ${serviceRoleKey}`, { 'x-vercel-cron': '1' });
    expect(response.status).toBe(200);
    expect(body).not.toMatchObject({ error: 'Forbidden: cron invocation only' });
    expect(body).not.toMatchObject({ error: 'Unauthorized' });
  });

  test('RPT-4: active sangjo subscription returns a generated report payload', async () => {
    const facility = sangjoFacility!;
    await seedActiveSubscription(facility.id);

    const { error: consultationError } = await supabase.from('consultations').insert({
      facility_id: facility.id,
      user_id: sangjoAdmin?.id,
      user_name: 'Smoke Seed',
      user_phone: '010-1234-5678',
      status: 'waiting',
      notes: 'report smoke seed',
      category: 'sangjo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(consultationError).toBeNull();

    const { response, body } = await callReportFunction(`Bearer ${serviceRoleKey}`, { 'x-vercel-cron': '1' });
    expect(response.status).toBe(200);
    expect(typeof body?.totalSubscriptions).toBe('number');
    expect(typeof body?.reportsGenerated).toBe('number');
    expect(Number(body?.totalSubscriptions)).toBeGreaterThanOrEqual(1);
    expect(Number(body?.reportsGenerated)).toBeGreaterThanOrEqual(1);
    expect(body).not.toMatchObject({ error: 'Forbidden: cron invocation only' });
  });
});
