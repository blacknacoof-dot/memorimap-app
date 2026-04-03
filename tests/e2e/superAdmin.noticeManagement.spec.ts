import { expect, test, type Page } from '@playwright/test';

import { supabase } from './db.utils';
import { setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

const marker = `notice-mgmt-${Date.now()}`;

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

const openNoticeManagementTab = async (page: Page) => {
  await page.goto('/#/super-admin');
  await page.getByTestId('super-admin-open-menu').click();
  await page.getByTestId('super-admin-menu-notices').click();
  await expect(page.getByTestId('notice-create-button')).toBeVisible({ timeout: 30000 });
};

const cleanupNoticeByTitle = async (title: string) => {
  const { error } = await supabase
    .from('platform_notices')
    .delete()
    .eq('title', title);

  if (error) {
    throw new Error(`Failed to cleanup notice ${title}: ${error.message}`);
  }
};

const readNoticeByTitle = async (title: string) => {
  const { data, error } = await supabase
    .from('platform_notices')
    .select('id, title, content, notice_type, is_active')
    .eq('title', title)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read notice ${title}: ${error.message}`);
  }

  return data;
};

test.describe.serial('Super Admin Notice Management', () => {
  test.setTimeout(180000);

  let baseFixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;

  test.beforeAll(async () => {
    baseFixture = await setupCoreFlowFixture(marker);
  });

  test.afterAll(async () => {
    await cleanupNoticeByTitle(`${marker} created`);
    await cleanupNoticeByTitle(`${marker} updated`);

    if (baseFixture) {
      await teardownCoreFlowFixture(baseFixture);
    }
  });

  test('creates, searches, updates, and soft deletes a platform notice', async ({ page }) => {
    const admin = baseFixture!.superAdminUser;
    const createdTitle = `${marker} created`;
    const updatedTitle = `${marker} updated`;
    const createdContent = `${marker} initial content`;
    const updatedContent = `${marker} updated content`;

    await loginAsSuperAdmin(page, admin.email, admin.password);
    await openNoticeManagementTab(page);

    await page.getByTestId('notice-create-button').click();
    await expect(page.getByTestId('notice-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('notice-type-urgent').click();
    await page.getByTestId('notice-title-input').fill(createdTitle);
    await page.getByTestId('notice-content-input').fill(createdContent);
    await page.getByTestId('notice-submit-button').click();
    await expect(page.getByTestId('notice-modal')).toBeHidden({ timeout: 10000 });

    await expect
      .poll(async () => {
        const data = await readNoticeByTitle(createdTitle);
        return data ? {
          title: String(data.title),
          content: String(data.content),
          noticeType: String(data.notice_type),
          isActive: Boolean(data.is_active),
        } : null;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toMatchObject({
        title: createdTitle,
        content: createdContent,
        noticeType: 'urgent',
        isActive: true,
      });

    await page.getByTestId('notice-search-input').fill(createdTitle);
    const createdNotice = await readNoticeByTitle(createdTitle);
    if (!createdNotice?.id) {
      throw new Error('Created notice id not found');
    }

    const noticeRow = page.getByTestId(`notice-row-${createdNotice.id}`);
    await expect(noticeRow).toBeVisible({ timeout: 30000 });
    await page.getByTestId(`notice-edit-${createdNotice.id}`).click();
    await expect(page.getByTestId('notice-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('notice-type-warning').click();
    await page.getByTestId('notice-title-input').fill(updatedTitle);
    await page.getByTestId('notice-content-input').fill(updatedContent);
    await page.getByTestId('notice-submit-button').click();
    await expect(page.getByTestId('notice-modal')).toBeHidden({ timeout: 10000 });

    await expect
      .poll(async () => {
        const data = await readNoticeByTitle(updatedTitle);
        return data ? {
          title: String(data.title),
          content: String(data.content),
          noticeType: String(data.notice_type),
          isActive: Boolean(data.is_active),
        } : null;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toMatchObject({
        title: updatedTitle,
        content: updatedContent,
        noticeType: 'warning',
        isActive: true,
      });

    await page.getByTestId('notice-search-input').fill(updatedTitle);
    const updatedNotice = await readNoticeByTitle(updatedTitle);
    if (!updatedNotice?.id) {
      throw new Error('Updated notice id not found');
    }

    await expect(page.getByTestId(`notice-row-${updatedNotice.id}`)).toBeVisible({ timeout: 30000 });
    await page.getByTestId(`notice-delete-${updatedNotice.id}`).click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });

    await expect
      .poll(async () => {
        const data = await readNoticeByTitle(updatedTitle);
        return data ? Boolean(data.is_active) : null;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBe(false);
  });
});
