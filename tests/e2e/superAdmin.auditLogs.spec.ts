import { expect, test, type Page } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

const marker = `audit-logs-${Date.now()}`;

const loginAsSuperAdmin = async (page: Page, email: string, password: string) => {
  const welcomeSheet = page.getByRole('dialog', { name: '異붾え留??쒖옉?섍린' });
  await page.goto('/');

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (await welcomeSheet.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await expect(welcomeSheet).toBeHidden({ timeout: 10000 });
    }

    await page.evaluate(() => {
      window.dispatchEvent(new Event('open-login-modal'));
    });
    await expect(page.getByTestId('login-modal')).toBeVisible({ timeout: 15000 });

    if (await welcomeSheet.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await expect(welcomeSheet).toBeHidden({ timeout: 10000 });
    }

    await page.getByTestId('login-email-input').fill(email);
    await page.getByTestId('login-password-input').fill(password);
    await page.getByTestId('login-submit-button').click({ force: true });

    let loginSucceeded = false;
    try {
      await expect.poll(async () => {
        const state = await page.evaluate(() => {
          const authKey = Object.keys(window.localStorage).find((key) => key.includes('auth-token'));
          return authKey ? window.localStorage.getItem(authKey) : null;
        });

        return Boolean(state && state !== 'null');
      }, { timeout: 30000, intervals: [500, 1000, 2000] }).toBe(true);
      loginSucceeded = true;
    } catch {
      loginSucceeded = false;
    }

    if (loginSucceeded) {
      await expect(page.getByTestId('login-modal')).toBeHidden({ timeout: 10000 }).catch(() => {});
      return;
    }

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(2000 * attempt);
  }

  throw new Error('Super admin login failed after 3 attempts');
};

const openAdminLogsTab = async (page: Page) => {
  await page.goto('/#/super-admin');
  await page.getByTestId('super-admin-open-menu').click();
  await page.getByTestId('super-admin-menu-logs').click();
  await expect(page.getByTestId('admin-logs-refresh')).toBeVisible({ timeout: 30000 });
};

test.describe.serial('Super Admin Audit Logs', () => {
  test.setTimeout(180000);

  let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
  let seededLogIds: string[] = [];

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);

    const inserted = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: baseFixture.superAdminUser.id,
          action: 'UPDATE_ROLE',
          resource_type: 'profiles',
          resource_id: `${marker}-target-role`,
          metadata: { new_role: 'facility_admin' },
        },
        {
          user_id: baseFixture.superAdminUser.id,
          action: 'premium_granted',
          resource_type: 'premium_grants',
          resource_id: `${marker}-premium-grant`,
          metadata: {
            target_user_id: baseFixture.regularUser.id,
            premium_source: 'partner_test',
            premium_expires_at: new Date(Date.now() + 86400000).toISOString(),
          },
        },
      ])
      .select('id');

    if (inserted.error) {
      throw new Error(`Failed to seed audit logs: ${inserted.error.message}`);
    }

    seededLogIds = (inserted.data || []).map((row) => String(row.id));
  });

  test.afterAll(async () => {
    if (seededLogIds.length > 0) {
      await supabase.from('audit_logs').delete().in('id', seededLogIds);
    }

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('renders latest audit logs for role updates and premium actions', async ({ page }) => {
    const admin = baseFixture!.superAdminUser;

    await loginAsSuperAdmin(page, admin.email, admin.password);
    await openAdminLogsTab(page);
    await page.getByTestId('admin-logs-refresh').click();

    const updateRoleRow = page.getByTestId(`admin-log-row-${seededLogIds[0]}`);
    const premiumGrantedRow = page.getByTestId(`admin-log-row-${seededLogIds[1]}`);

    await expect(updateRoleRow).toBeVisible({ timeout: 30000 });
    await expect(premiumGrantedRow).toBeVisible({ timeout: 30000 });

    await expect(updateRoleRow.getByText('권한 변경')).toBeVisible({ timeout: 10000 });
    await expect(premiumGrantedRow.getByText('premium_granted')).toBeVisible({ timeout: 10000 });
    await expect(updateRoleRow.getByText(baseFixture!.superAdminUser.id.slice(0, 8), { exact: false })).toBeVisible({ timeout: 10000 });
  });
});
