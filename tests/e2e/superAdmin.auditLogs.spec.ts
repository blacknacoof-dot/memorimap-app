import { expect, test } from '@playwright/test';

import { supabase } from './db.utils';
import { loginViaUi, setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

const marker = `audit-logs-${Date.now()}`;

const openAdminLogsTab = async (page: import('@playwright/test').Page) => {
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

    await loginViaUi(page, admin.email, admin.password);
    await openAdminLogsTab(page);
    await page.getByTestId('admin-logs-refresh').click();

    const updateRoleRow = page.getByTestId(`admin-log-row-${seededLogIds[0]}`);
    const premiumGrantedRow = page.getByTestId(`admin-log-row-${seededLogIds[1]}`);

    await expect(updateRoleRow).toBeVisible({ timeout: 30000 });
    await expect(premiumGrantedRow).toBeVisible({ timeout: 30000 });

    await expect(updateRoleRow).toContainText('권한 변경');
    await expect(premiumGrantedRow).toContainText('premium_granted');
    await expect(updateRoleRow).toContainText(baseFixture!.superAdminUser.id.slice(0, 8));
  });
});
