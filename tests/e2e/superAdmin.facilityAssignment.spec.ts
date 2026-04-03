import { expect, test, type Page } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';
import { deleteHighRiskUser, type HighRiskUser } from './highRisk.helpers';

const marker = `facmgrassign-${Date.now()}`;

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

const loginAsFacilityAdmin = async (page: Page, email: string, password: string) => {
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

const openFacilityManagementTab = async (page: Page) => {
  await page.goto('/#/super-admin');
  await page.getByTestId('super-admin-open-menu').click();
  await page.getByTestId('super-admin-menu-facilities').click();
  await expect(page.getByTestId('facility-management-search-input')).toBeVisible({ timeout: 30000 });
};

const createVisibleFacilityAdmin = async (name: string): Promise<HighRiskUser> => {
  const token = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `${name}.${token}@memorimap.dev`.toLowerCase();
  const password = `Fa!${token}Aa`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
    },
  });

  if (error || !data.user?.id) {
    throw new Error(`Failed to create visible facility admin auth user: ${error?.message || 'unknown error'}`);
  }

  const userId = data.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    clerk_id: userId,
    email,
    full_name: name,
    role: 'facility_admin',
  }, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Failed to upsert visible facility admin profile: ${profileError.message}`);
  }

  return {
    id: userId,
    email,
    password,
    role: 'facility_admin',
  };
};

test.describe.serial('Super Admin Facility Assignment', () => {
  test.setTimeout(180000);

  let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
  let facilityAdmin: HighRiskUser | null = null;
  let targetFacility: { id: string; name: string } | null = null;

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    facilityAdmin = await createVisibleFacilityAdmin(`${marker}-facility-admin`);

    const facilityName = `${marker} facility`;
    const { data, error } = await supabase
      .from('facilities')
      .insert({
        name: facilityName,
        type: 'funeral_home',
        user_id: baseFixture.superAdminUser.id,
        verified: true,
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울특별시 강남구 테스트로 103',
      })
      .select('id, name')
      .single();

    if (error || !data?.id) {
      throw new Error(`Failed to create facility assignment fixture: ${error?.message || 'unknown error'}`);
    }

    targetFacility = {
      id: String(data.id),
      name: String(data.name),
    };
  });

  test.afterAll(async () => {
    if (targetFacility) {
      await supabase.from('facilities').delete().eq('id', targetFacility.id);
    }

    if (facilityAdmin) {
      await deleteHighRiskUser(facilityAdmin.id);
    }

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('assigns a facility admin and the assigned user can access the facility admin dashboard', async ({ page, browser }) => {
    const admin = baseFixture!.superAdminUser;
    const assignedUser = facilityAdmin!;
    const facility = targetFacility!;

    await loginAsSuperAdmin(page, admin.email, admin.password);
    await openFacilityManagementTab(page);

    await page.getByTestId('facility-management-search-input').fill(facility.name);
    await page.getByRole('button', { name: '검색' }).click();

    const facilityCard = page.getByTestId(`admin-facility-card-${facility.id}`);
    await expect(facilityCard).toBeVisible({ timeout: 30000 });

    await page.getByTestId(`admin-facility-edit-${facility.id}`).click();
    await page.getByTestId(`admin-facility-manager-select-${facility.id}`).selectOption(assignedUser.id);
    await page.getByTestId(`admin-facility-manager-save-${facility.id}`).click();

    await expect
      .poll(async () => {
        const { data, error } = await supabase
          .from('facilities')
          .select('user_id')
          .eq('id', facility.id)
          .single();

        if (error) {
          throw new Error(`Failed to read updated facility owner: ${error.message}`);
        }

        return data.user_id;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBe(assignedUser.id);

    const isolatedPage = await browser.newPage();
    try {
      await loginAsFacilityAdmin(isolatedPage, assignedUser.email, assignedUser.password);
      await isolatedPage.goto('/#/facility-admin');

      await expect(isolatedPage.getByRole('heading', { name: facility.name })).toBeVisible({ timeout: 30000 });
      await expect(isolatedPage.getByTestId('facility-edit-open-button')).toBeVisible({ timeout: 30000 });
    } finally {
      await isolatedPage.close();
    }
  });
});
