import { expect, test, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

import { supabase } from './db.utils';
import { loginViaUi, setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';
import type { Consultation } from '../../types/consultation';
import { buildFacilitySubscriptionCriteria, getFacilitySubscriptionConflictTarget } from './highRisk.helpers';

const marker = `ai-consult-flow-${Date.now()}`;

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

const getSubscriptionMatch = (facilityId: string) => {
  const criteria = buildFacilitySubscriptionCriteria(facilityId);
  return criteria.column === 'facility_id_uuid'
    ? { facility_id: facilityId, facility_id_uuid: criteria.value, facility_id_bigint: null }
    : { facility_id: facilityId, facility_id_uuid: null, facility_id_bigint: criteria.value };
};

const seedFacilitySubscription = async (facilityId: string, planId: 'FREE' | 'PREMIUM') => {
  const conflictTarget = getFacilitySubscriptionConflictTarget(facilityId);
  const { error } = await supabase
    .from('facility_subscriptions')
    .upsert({
      ...getSubscriptionMatch(facilityId),
      plan_id: planId,
      status: 'active',
      ai_chat_used: 0,
      sms_used: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: conflictTarget });

  if (error) {
    throw new Error(`Failed to seed facility subscription: ${error.message}`);
  }
};

const clearFacilitySubscription = async (facilityId: string) => {
  const criteria = buildFacilitySubscriptionCriteria(facilityId);
  const { error } = await supabase
    .from('facility_subscriptions')
    .delete()
    .eq(criteria.column, criteria.value);

  if (error) {
    throw new Error(`Failed to cleanup facility subscription: ${error.message}`);
  }
};

const clearConsultations = async (userId: string, facilityId: string) => {
  const { error } = await supabase
    .from('consultations')
    .delete()
    .eq('user_id', userId)
    .eq('facility_id', facilityId);

  if (error) {
    throw new Error(`Failed to cleanup consultations: ${error.message}`);
  }
};

const seedConsultation = async (params: {
  facilityId: string;
  userId: string;
  userName: string;
  userPhone: string;
}): Promise<Consultation> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('consultations')
    .insert({
      facility_id: params.facilityId,
      user_id: params.userId,
      user_name: params.userName,
      user_phone: params.userPhone,
      status: 'waiting',
      notes: 'ai consultation realtime test',
      created_at: now,
      updated_at: now,
    })
    .select('id, user_id, facility_id, created_at, updated_at, status')
    .single();

  if (error || !data) {
    throw new Error(`Failed to seed consultation: ${error?.message || 'unknown error'}`);
  }

  return {
    ...(data as Omit<Consultation, 'messages'>),
    topic: '일반 상담',
    messages: [{ role: 'user', text: '기존 상담입니다.', timestamp: new Date(now) }],
  };
};

const openConsultationView = async (page: Page, facilityId: string, facilityName: string, consultation?: Consultation | null) => {
  await expect(page.getByTestId('bottom-nav-list')).toBeVisible({ timeout: 30000 });
  await page.getByTestId('bottom-nav-list').click();
  await page.locator('#smart-search-input').fill(facilityName);
  await expect(page.getByTestId(`facility-card-${facilityId}`)).toBeVisible({ timeout: 30000 });

  await page.evaluate(({ targetFacilityId, existingConsultation }) => {
    window.dispatchEvent(new CustomEvent('e2e-open-consultation-view', {
      detail: { facilityId: targetFacilityId, consultation: existingConsultation },
    }));
  }, { targetFacilityId: facilityId, existingConsultation: consultation ?? null });

  await expect(page.getByText(/AI 상담/)).toBeVisible({ timeout: 30000 });
};

const sendFirstMessage = async (page: Page, text: string) => {
  const input = page.locator('form input[type="text"]').last();
  await expect(input).toBeVisible({ timeout: 30000 });
  await input.fill(text);
  await page.locator('form button[type="submit"]').click();
};

let fixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for AI consultation tests');
}

const loginForAiConsultation = async (page: Page, email: string, password: string) => {
  await page.goto('/');
  const welcomeSheet = page.getByRole('dialog', { name: '추모맵 시작하기' });
  if (await welcomeSheet.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape').catch(() => {});
    await expect(welcomeSheet).toBeHidden({ timeout: 10000 });
  }

  await loginViaUi(page, email, password);
};

const createAuthenticatedClient = async (email: string, password: string) => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in fixture user: ${error.message}`);
  }

  return client;
};

test.describe.serial('AI consultation flows', () => {
  test.setTimeout(180000);

  test.beforeAll(async () => {
    await ensureFacilityPlans();
    fixture = await setupCoreFlowFixture(marker);
  });

  test.afterEach(async () => {
    const fx = fixture!;
    await clearConsultations(fx.regularUser.id, fx.facilityId);
    await clearFacilitySubscription(fx.facilityId);
  });

  test.afterAll(async () => {
    if (fixture) {
      await teardownCoreFlowFixture(fixture);
    }
  });

  test('B-1: facility quota exhaustion blocks a new consultation before insert', async () => {
    const fx = fixture!;
    await seedFacilitySubscription(fx.facilityId, 'FREE');
    const authedClient = await createAuthenticatedClient(fx.regularUser.email, fx.regularUser.password);

    const { data, error: quotaError } = await authedClient.rpc('check_and_increment_ai_consult_quotas', {
      p_facility_id: fx.facilityId,
      p_category: 'memorial_facility',
    });

    expect(quotaError).toBeNull();
    expect(data).toMatchObject({
      allowed: false,
      reason: 'facility_limit',
      limit: 0,
    });

    const { count, error: consultationCountError } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', fx.regularUser.id)
      .eq('facility_id', fx.facilityId);

    expect(consultationCountError).toBeNull();
    expect(count ?? 0).toBe(0);
  });

  test('B-2: user view reflects consultation status updates in real time', async ({ page }) => {
    const fx = fixture!;
    const consultation = await seedConsultation({
      facilityId: fx.facilityId,
      userId: fx.regularUser.id,
      userName: 'Realtime User',
      userPhone: '010-1234-5678',
    });

    await loginForAiConsultation(page, fx.regularUser.email, fx.regularUser.password);
    await openConsultationView(page, fx.facilityId, fx.facilityName, consultation);
    await expect(page.getByText('기존 상담입니다.')).toBeVisible({ timeout: 30000 });

    const updateAccepted = await supabase
      .from('consultations')
      .update({ status: 'accepted' })
      .eq('id', consultation.id);

    expect(updateAccepted.error).toBeNull();
    await expect(page.getByTestId('consultation-status-badge')).toHaveText('접수됨', { timeout: 30000 });

    const updateCompleted = await supabase
      .from('consultations')
      .update({ status: 'completed' })
      .eq('id', consultation.id);

    expect(updateCompleted.error).toBeNull();
    await expect(page.getByTestId('consultation-status-badge')).toHaveText('완료', { timeout: 30000 });
  });
});
