import { expect, test, type Page } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

const marker = `superadmin-personal-premium-${Date.now()}`;
const premiumActions = ['premium_granted', 'premium_extended', 'premium_revoked'] as const;

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

const openPersonalSubscriptionTab = async (page: Page) => {
  await page.goto('/#/super-admin');
  await page.getByTestId('super-admin-open-menu').click();
  await page.getByTestId('super-admin-menu-personal_subs').click();
  await expect(page.getByTestId('personal-subs-search-input')).toBeVisible({ timeout: 30000 });
};

const seedPersonalSubscription = async (userId: string) => {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 3);

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: 'PERSONAL_FREE',
      plan_name: 'PERSONAL_FREE',
      status: 'active',
      ai_consult_used: 0,
      sangjo_compare_used: 0,
      favorites_count: 0,
      sangjo_favorites_count: 0,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      billing_cycle: 'monthly',
    }, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Failed to seed personal subscription: ${error.message}`);
  }
};

const cleanupPremiumState = async (userId: string, adminId: string) => {
  await supabase.from('premium_grants').delete().eq('user_id', userId);
  await supabase
    .from('audit_logs')
    .delete()
    .eq('user_id', adminId)
    .in('action', [...premiumActions]);
};

const selectPersonalSubscriptionUser = async (page: Page, userId: string, email: string) => {
  await page.getByTestId('personal-subs-search-input').fill(email);
  const userRow = page.getByTestId(`personal-subs-user-row-${userId}`);
  await expect(userRow).toBeVisible({ timeout: 30000 });
  await userRow.click();
  await expect(page.getByTestId('personal-premium-grant-button')).toBeEnabled({ timeout: 15000 });
};

const readActiveGrant = async (userId: string) => {
  const { data, error } = await supabase
    .from('premium_grants')
    .select('id, user_id, premium_source, premium_status, premium_expires_at, revoke_reason')
    .eq('user_id', userId)
    .eq('premium_status', 'active')
    .order('premium_granted_at', { ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read premium grant: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to read premium grant: active grant not found');
  }

  return data;
};

const readGrantById = async (grantId: string) => {
  const { data, error } = await supabase
    .from('premium_grants')
    .select('id, user_id, premium_source, premium_status, premium_expires_at, revoke_reason')
    .eq('id', grantId)
    .single();

  if (error) {
    throw new Error(`Failed to read premium grant by id: ${error.message}`);
  }

  return data;
};

const expectAuditLog = async (adminId: string, action: (typeof premiumActions)[number], resourceId: string) => {
  await expect
    .poll(async () => {
      const { count, error } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', adminId)
        .eq('action', action)
        .eq('resource_type', 'premium_grants')
        .eq('resource_id', resourceId);

      if (error) {
        throw new Error(`Failed to read audit log for ${action}: ${error.message}`);
      }

      return count ?? 0;
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBeGreaterThan(0);
};

const throwIfToastShowsError = async (page: Page) => {
  await page.waitForTimeout(1500);
  const toastTexts = await page.locator('[data-sonner-toast]').allTextContents().catch(() => []);
  const errorToast = toastTexts.find((text) => /실패|오류|already|required|Invalid/i.test(text));

  if (errorToast) {
    throw new Error(`Personal premium action toast error: ${errorToast}`);
  }
};

test.describe.serial('Super Admin Personal Premium Manager', () => {
  test.setTimeout(180000);

  let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    await cleanupPremiumState(baseFixture.regularUser.id, baseFixture.superAdminUser.id);
    await seedPersonalSubscription(baseFixture.regularUser.id);
  });

  test.afterAll(async () => {
    if (baseFixture) {
      await cleanupPremiumState(baseFixture.regularUser.id, baseFixture.superAdminUser.id);
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('grants, extends, and revokes premium override with audit logs', async ({ page }) => {
    const admin = baseFixture!.superAdminUser;
    const targetUser = baseFixture!.regularUser;
    const revokeReason = 'e2e manual revoke';

    await loginAsSuperAdmin(page, admin.email, admin.password);
    await openPersonalSubscriptionTab(page);
    await selectPersonalSubscriptionUser(page, targetUser.id, targetUser.email);

    await page.getByTestId('personal-premium-grant-source').selectOption('partner_test');
    await page.getByTestId('personal-premium-grant-button').click({ force: true });
    await throwIfToastShowsError(page);

    await expect
      .poll(async () => {
        const data = await readActiveGrant(targetUser.id);
        return {
          id: String(data.id),
          premiumSource: String(data.premium_source),
          premiumStatus: String(data.premium_status),
          premiumExpiresAt: String(data.premium_expires_at),
        };
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toMatchObject({
        premiumSource: 'partner_test',
        premiumStatus: 'active',
      });

    const grantedRow = await readActiveGrant(targetUser.id);
    const grantedExpiry = Date.parse(String(grantedRow.premium_expires_at));
    await expectAuditLog(admin.id, 'premium_granted', String(grantedRow.id));

    await page.getByTestId('personal-premium-extend-7').click({ force: true });
    await throwIfToastShowsError(page);

    await expect
      .poll(async () => {
        const data = await readActiveGrant(targetUser.id);
        return Date.parse(String(data.premium_expires_at));
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBeGreaterThan(grantedExpiry);

    const extendedRow = await readActiveGrant(targetUser.id);
    await expectAuditLog(admin.id, 'premium_extended', String(extendedRow.id));

    await page.getByTestId('personal-premium-revoke-reason').fill(revokeReason);
    await page.getByTestId('personal-premium-revoke-button').click({ force: true });
    await throwIfToastShowsError(page);

    await expect
      .poll(async () => {
        const data = await readGrantById(String(extendedRow.id));
        return {
          premiumStatus: String(data.premium_status),
          revokeReason: String(data.revoke_reason ?? ''),
        };
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toMatchObject({
        premiumStatus: 'revoked',
        revokeReason,
      });

    await expectAuditLog(admin.id, 'premium_revoked', String(extendedRow.id));
  });
});
