import { expect, test, type Page } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

const marker = `system-settings-${Date.now()}`;

type SystemSettingValue = string | number | boolean | null;

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

const openSystemSettingsTab = async (page: Page) => {
  await page.goto('/#/super-admin');
  await page.getByTestId('super-admin-open-menu').click();
  await page.getByTestId('super-admin-menu-system_settings').click();
  await expect(page.getByTestId('system-settings-maintenance-toggle')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('system-settings-commission-input')).toBeVisible({ timeout: 30000 });
};

const readSystemSetting = async (key: string): Promise<SystemSettingValue> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read system setting ${key}: ${error.message}`);
  }

  return (data?.value as SystemSettingValue) ?? null;
};

const upsertSystemSetting = async (key: string, value: Exclude<SystemSettingValue, null>) => {
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    throw new Error(`Failed to upsert system setting ${key}: ${error.message}`);
  }
};

const restoreSystemSetting = async (key: string, value: SystemSettingValue) => {
  if (value === null) {
    const { error } = await supabase.from('system_settings').delete().eq('key', key);
    if (error) {
      throw new Error(`Failed to delete system setting ${key}: ${error.message}`);
    }
    return;
  }

  await upsertSystemSetting(key, value);
};

const asBoolean = (value: SystemSettingValue) => value === true || value === 'true';

const expectSystemSetting = async (key: string, expected: string | boolean) => {
  await expect
    .poll(async () => {
      const value = await readSystemSetting(key);
      if (typeof expected === 'boolean') {
        return asBoolean(value);
      }

      return String(value);
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBe(expected);
};

test.describe.serial('Super Admin System Settings', () => {
  test.setTimeout(180000);

  let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
  let originalMaintenanceMode: SystemSettingValue = null;
  let originalCommissionRate: SystemSettingValue = null;

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    originalMaintenanceMode = await readSystemSetting('maintenance_mode');
    originalCommissionRate = await readSystemSetting('commission_rate');
    await upsertSystemSetting('maintenance_mode', false);
    await upsertSystemSetting('commission_rate', '3.5');
  });

  test.afterAll(async () => {
    await restoreSystemSetting('maintenance_mode', originalMaintenanceMode);
    await restoreSystemSetting('commission_rate', originalCommissionRate);

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('updates maintenance mode and commission rate with persistence after reload', async ({ page }) => {
    const admin = baseFixture!.superAdminUser;
    const nextCommissionRate = '7.25';

    await loginAsSuperAdmin(page, admin.email, admin.password);
    await openSystemSettingsTab(page);

    const maintenanceToggle = page.getByTestId('system-settings-maintenance-toggle');
    await expect(maintenanceToggle).not.toBeChecked();
    await maintenanceToggle.click({ force: true });
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expectSystemSetting('maintenance_mode', true);
    await expect(maintenanceToggle).toBeChecked({ timeout: 10000 });

    await page.reload();
    await openSystemSettingsTab(page);
    await expect(page.getByTestId('system-settings-maintenance-toggle')).toBeChecked({ timeout: 30000 });

    await page.getByTestId('system-settings-maintenance-toggle').click({ force: true });
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expectSystemSetting('maintenance_mode', false);
    await expect(page.getByTestId('system-settings-maintenance-toggle')).not.toBeChecked({ timeout: 10000 });

    const commissionInput = page.getByTestId('system-settings-commission-input');
    await commissionInput.fill(nextCommissionRate);
    await page.getByTestId('system-settings-commission-save').click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expectSystemSetting('commission_rate', nextCommissionRate);

    await page.reload();
    await openSystemSettingsTab(page);
    await expect(page.getByTestId('system-settings-commission-input')).toHaveValue(nextCommissionRate, { timeout: 30000 });
  });
});
