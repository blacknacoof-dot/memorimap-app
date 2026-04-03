import { expect, test, type Page } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';
import { deleteHighRiskUser, type HighRiskUser } from './highRisk.helpers';

const marker = `user-role-mgmt-${Date.now()}`;

const loginWithOverlayDismiss = async (page: Page, email: string, password: string) => {
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

const openUserManagementTab = async (page: Page) => {
  await page.goto('/#/super-admin');
  await page.getByTestId('super-admin-open-menu').click();
  await page.getByTestId('super-admin-menu-users').click();
  await expect(page.getByTestId('user-management-search-input')).toBeVisible({ timeout: 30000 });
};

const createVisibleUser = async (name: string): Promise<HighRiskUser> => {
  const token = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `${name}.${token}@memorimap.dev`.toLowerCase();
  const password = `Ur!${token}Aa`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
    },
  });

  if (error || !data.user?.id) {
    throw new Error(`Failed to create visible user auth row: ${error?.message || 'unknown error'}`);
  }

  const userId = data.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    clerk_id: userId,
    email,
    full_name: name,
    role: 'user',
  }, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Failed to upsert visible user profile: ${profileError.message}`);
  }

  return {
    id: userId,
    email,
    password,
    role: 'user',
  };
};

test.describe.serial('Super Admin User Role Management', () => {
  test.setTimeout(180000);

  let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
  let targetUser: HighRiskUser | null = null;

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    targetUser = await createVisibleUser(`${marker}-target-user`);
  });

  test.afterAll(async () => {
    if (targetUser) {
      await supabase.from('audit_logs').delete().eq('resource_id', targetUser.id).eq('action', 'UPDATE_ROLE');
      await deleteHighRiskUser(targetUser.id);
    }

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('changes user role to facility_admin and reflects access in UI and DB', async ({ page, browser }) => {
    const admin = baseFixture!.superAdminUser;
    const candidate = targetUser!;

    await loginWithOverlayDismiss(page, admin.email, admin.password);
    await openUserManagementTab(page);

    await page.getByTestId('user-management-search-input').fill(candidate.email);
    const roleSelect = page.getByTestId(`user-management-role-select-${candidate.id}`);
    await expect(roleSelect).toBeVisible({ timeout: 30000 });

    await roleSelect.selectOption('facility_admin');
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();

    await expect
      .poll(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('clerk_id', candidate.id)
          .single();

        if (error) {
          throw new Error(`Failed to read updated profile role: ${error.message}`);
        }

        return data.role;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBe('facility_admin');

    await expect
      .poll(async () => {
        const { count, error } = await supabase
          .from('audit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('resource_type', 'profiles')
          .eq('resource_id', candidate.id)
          .eq('action', 'UPDATE_ROLE');

        if (error) {
          throw new Error(`Failed to read UPDATE_ROLE audit log: ${error.message}`);
        }

        return count ?? 0;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBeGreaterThan(0);

    const isolatedPage = await browser.newPage();
    try {
      await loginWithOverlayDismiss(isolatedPage, candidate.email, candidate.password);
      await isolatedPage.goto('/#/facility-admin');

      await expect(isolatedPage.getByRole('heading', { name: /업체 관리 대시보드/ })).toBeVisible({ timeout: 30000 });
      await expect(isolatedPage.getByRole('heading', { name: /관리 중인 시설이 없습니다/ })).toBeVisible({ timeout: 30000 });
    } finally {
      await isolatedPage.close();
    }
  });
});
