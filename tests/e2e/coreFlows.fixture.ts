import { expect, Page } from '@playwright/test';
import { supabase } from './db.utils';

type CoreRole = 'user' | 'super_admin';

export interface CoreFlowUser {
  id: string;
  email: string;
  password: string;
  role: CoreRole;
}

export interface CoreFlowFixture {
  marker: string;
  regularUser: CoreFlowUser;
  superAdminUser: CoreFlowUser;
  facilityId: string;
  facilityName: string;
}

const randomToken = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const FIXTURE_STEP_TIMEOUT_MS = 20000;
const LOGIN_UI_TIMEOUT_MS = 20000;
const LOGIN_MAX_ATTEMPTS = 3;

async function runInstrumentedStep<T>(
  step: string,
  action: () => PromiseLike<T>,
  timeoutMs = FIXTURE_STEP_TIMEOUT_MS,
): Promise<T> {
  const startedAt = Date.now();
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const elapsedMs = Date.now() - startedAt;
      reject(new Error(`[core-flow-fixture][TIMEOUT] step=${step} elapsedMs=${elapsedMs} timeoutMs=${timeoutMs}`));
    }, timeoutMs);

    Promise.resolve(action())
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function createUser(role: CoreRole, marker: string): Promise<CoreFlowUser> {
  const token = randomToken();
  const email = `${marker}.${role}.${token}@example.com`.toLowerCase();
  const password = `C2!${token}Aa`;

  const { data, error } = await runInstrumentedStep(
    `createUser(${role}).supabase.auth.admin.createUser`,
    () => supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${marker}-${role}`,
      },
    }),
  );

  if (error || !data.user?.id) {
    throw new Error(`Failed to create auth user (${role}): ${error?.message || 'unknown error'}`);
  }

  const userId = data.user.id;
  const { error: profileError } = await runInstrumentedStep(
    `createUser(${role}).supabase.profiles.upsert`,
    async () => await supabase.from('profiles').upsert({
      id: userId,
      clerk_id: userId,
      email,
      full_name: `${marker}-${role}`,
      role,
    }, { onConflict: 'id' }),
  );

  if (profileError) {
    throw new Error(`Failed to upsert profile (${role}): ${profileError.message}`);
  }

  if (role === 'super_admin') {
    const { error: superAdminError } = await runInstrumentedStep(
      `createUser(${role}).supabase.super_admins.upsert`,
      async () => await supabase.from('super_admins').upsert({
        user_id: userId,
        is_active: true,
      }, { onConflict: 'user_id' }),
    );

    if (superAdminError) {
      throw new Error(`Failed to upsert super_admins record: ${superAdminError.message}`);
    }
  }

  return { id: userId, email, password, role };
}

export async function setupCoreFlowFixture(marker: string): Promise<CoreFlowFixture> {
  const regularUser = await runInstrumentedStep(
    'setupCoreFlowFixture.createUser(user)',
    () => createUser('user', marker),
  );
  const superAdminUser = await runInstrumentedStep(
    'setupCoreFlowFixture.createUser(super_admin)',
    () => createUser('super_admin', marker),
  );

  const facilityName = `${marker} Facility`;
  const { data: facility, error: facilityError } = await runInstrumentedStep(
    'setupCoreFlowFixture.supabase.facilities.insert.select.single',
    async () => await supabase
    .from('facilities')
    .insert({
      name: facilityName,
      type: 'columbarium',
      user_id: superAdminUser.id,
      verified: true,
      latitude: 37.5665,
      longitude: 126.978,
      address: '서울특별시 강남구 테스트로 100',
    })
    .select('id, name')
    .single(),
  );

  if (facilityError || !facility?.id) {
    throw new Error(`Failed to create fixture facility: ${facilityError?.message || 'unknown error'}`);
  }

  return {
    marker,
    regularUser,
    superAdminUser,
    facilityId: String(facility.id),
    facilityName: facility.name || facilityName,
  };
}

export async function teardownCoreFlowFixture(fixture: CoreFlowFixture): Promise<void> {
  const userIds = [fixture.regularUser.id, fixture.superAdminUser.id];

  await supabase.from('user_subscriptions').delete().in('user_id', userIds);
  await supabase.from('facility_reviews').delete().eq('facility_id', fixture.facilityId).in('user_id', userIds);
  await supabase.from('reservations').delete().eq('facility_id', fixture.facilityId).in('user_id', userIds);
  await supabase.from('user_notifications').delete().in('user_id', userIds);
  await supabase.from('super_admins').delete().eq('user_id', fixture.superAdminUser.id);
  await supabase.from('profiles').delete().in('clerk_id', userIds);
  await supabase.from('facilities').delete().eq('id', fixture.facilityId);

  await supabase.auth.admin.deleteUser(fixture.regularUser.id);
  await supabase.auth.admin.deleteUser(fixture.superAdminUser.id);
}

export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');

  for (let attempt = 1; attempt <= LOGIN_MAX_ATTEMPTS; attempt++) {
    await page.evaluate(() => {
      window.dispatchEvent(new Event('open-login-modal'));
    });
    await expect(page.getByTestId('login-modal')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('login-email-input').fill(email);
    await page.getByTestId('login-password-input').fill(password);
    await page.getByTestId('login-submit-button').click();

    // UI 로그인 성공 확인: 모달 닫힘 또는 bottom-nav 표시 중 하나라도 먼저 확인되면 성공
    const loginSucceeded = await Promise.race([
      expect(page.getByTestId('login-modal'))
        .toBeHidden({ timeout: LOGIN_UI_TIMEOUT_MS })
        .then(() => true)
        .catch(() => false),
      expect(page.getByTestId('bottom-nav-list'))
        .toBeVisible({ timeout: LOGIN_UI_TIMEOUT_MS })
        .then(() => true)
        .catch(() => false),
    ]);

    if (loginSucceeded) return;

    if (attempt < LOGIN_MAX_ATTEMPTS) {
      // 로그인 실패 시 모달 닫고 대기 후 재시도 (Supabase 일시적 오류 대응)
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(2000 * attempt);
    }
  }

  throw new Error(`UI login failed after ${LOGIN_MAX_ATTEMPTS} attempts: login-modal did not close and bottom-nav-list did not appear`);
}

export async function openFixtureFacilityFromList(page: Page, facilityId: string, facilityName?: string): Promise<string> {
  await expect(page.getByTestId('bottom-nav-list')).toBeVisible({ timeout: 30000 });
  await page.getByTestId('bottom-nav-list').click({ force: true }).catch(() => {});
  await page.evaluate(() => {
    const listButton = document.querySelector('[data-testid="bottom-nav-list"]') as HTMLElement | null;
    listButton?.click();
  }).catch(() => {});

  for (let i = 0; i < 3; i += 1) {
    const naverMapLinkVisible = await page.getByRole('link', { name: 'NAVER' }).isVisible().catch(() => false);
    if (!naverMapLinkVisible) break;

    await page.evaluate(() => {
      const listButton = document.querySelector('[data-testid="bottom-nav-list"]') as HTMLElement | null;
      listButton?.click();
    }).catch(() => {});
    await page.waitForTimeout(300);
  }

  await expect(page.getByTestId('filter-category-all')).toBeVisible({ timeout: 30000 });

  if (facilityName) {
    const searchInput = page.locator('#smart-search-input');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(facilityName);
      await page.waitForTimeout(1000);
    }
  }

  const preferredCard = page.getByTestId(`facility-card-${facilityId}`).first();
  const categorySequence = ['all', 'funeral_home', 'columbarium', 'natural_burial', 'cemetery', 'pet_funeral', 'sea_burial'] as const;

  for (const category of categorySequence) {
    await page.getByTestId('filter-category-all').click();
    if (category !== 'all') {
      await page.getByTestId(`filter-category-${category}`).click();
    }

    await page.waitForTimeout(1000);

    if (await preferredCard.isVisible().catch(() => false)) {
      await preferredCard.click();
      return facilityId;
    }

    if (facilityName) {
      continue;
    }

    const firstCard = page.locator('[data-testid^="facility-card-"]').first();
    if (await firstCard.isVisible().catch(() => false)) {
      const testId = await firstCard.getAttribute('data-testid');
      if (!testId) {
        throw new Error('Unable to resolve facility card test id');
      }
      await firstCard.click();
      return testId.replace('facility-card-', '');
    }
  }

  throw new Error(`Unable to find facility card for fixture facility ${facilityId}`);
}
