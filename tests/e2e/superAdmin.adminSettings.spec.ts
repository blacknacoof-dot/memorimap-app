import { expect, test, type Page } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

const marker = `admin-settings-${Date.now()}`;
const NOTIF_KEYS = ['admin_notif_consultation', 'admin_notif_payment', 'admin_notif_admission'] as const;

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

const openAdminSettingsTab = async (page: Page) => {
  await page.goto('/#/super-admin');
  await page.getByTestId('super-admin-open-menu').click();
  await page.getByTestId('super-admin-menu-admin_settings').click();
  await expect(page.getByTestId('admin-settings-fullname-input')).toBeVisible({ timeout: 30000 });
};

const readProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, phone_number')
    .eq('clerk_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to read admin profile: ${error.message}`);
  }

  return data;
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

const restoreSystemSetting = async (key: string, value: SystemSettingValue) => {
  if (value === null) {
    const { error } = await supabase.from('system_settings').delete().eq('key', key);
    if (error) {
      throw new Error(`Failed to delete system setting ${key}: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    throw new Error(`Failed to restore system setting ${key}: ${error.message}`);
  }
};

test.describe.serial('Super Admin Admin Settings', () => {
  test.setTimeout(180000);

  let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
  let originalFullName = '';
  let originalPhone = '';
  const originalNotifSettings = new Map<string, SystemSettingValue>();

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
    const profile = await readProfile(baseFixture.superAdminUser.id);
    originalFullName = String(profile.full_name ?? '');
    originalPhone = String(profile.phone_number ?? '');

    for (const key of NOTIF_KEYS) {
      originalNotifSettings.set(key, await readSystemSetting(key));
      await restoreSystemSetting(key, 'true');
    }
  });

  test.afterAll(async () => {
    if (baseFixture) {
      await supabase
        .from('profiles')
        .update({ full_name: originalFullName, phone_number: originalPhone })
        .eq('clerk_id', baseFixture.superAdminUser.id);
    }

    for (const [key, value] of originalNotifSettings.entries()) {
      await restoreSystemSetting(key, value);
    }

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('updates admin profile and notification toggles', async ({ page }) => {
    const admin = baseFixture!.superAdminUser;
    const nextFullName = `${marker}-profile`;
    const nextPhone = '010-1234-5678';

    await loginAsSuperAdmin(page, admin.email, admin.password);
    await openAdminSettingsTab(page);

    await page.getByTestId('admin-settings-fullname-input').fill(nextFullName);
    await page.getByTestId('admin-settings-phone-input').fill(nextPhone);
    await page.getByTestId('admin-settings-save-profile').click();

    await expect
      .poll(async () => {
        const data = await readProfile(admin.id);
        return {
          fullName: String(data.full_name ?? ''),
          phone: String(data.phone_number ?? ''),
        };
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toMatchObject({
        fullName: nextFullName,
        phone: nextPhone,
      });

    for (const key of NOTIF_KEYS) {
      const toggle = page.getByTestId(`admin-settings-toggle-${key}`);
      await expect(toggle).toBeChecked({ timeout: 10000 });
      await toggle.click({ force: true });

      await expect
        .poll(async () => String(await readSystemSetting(key)), { timeout: 15000, intervals: [500, 1000, 2000] })
        .toBe('false');
    }

    await page.reload();
    await openAdminSettingsTab(page);

    await expect(page.getByTestId('admin-settings-fullname-input')).toHaveValue(nextFullName, { timeout: 30000 });
    await expect(page.getByTestId('admin-settings-phone-input')).toHaveValue(nextPhone, { timeout: 30000 });

    for (const key of NOTIF_KEYS) {
      await expect(page.getByTestId(`admin-settings-toggle-${key}`)).not.toBeChecked({ timeout: 10000 });
    }
  });
});
