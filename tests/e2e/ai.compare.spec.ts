import { expect, test, Page } from '@playwright/test';

import { supabase } from './db.utils';
import { loginViaUi, setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

const marker = `ai-compare-${Date.now()}`;

let fixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;

const cleanupLeads = async (userId: string) => {
  await supabase.from('leads').delete().eq('user_id', userId);
};

const openUrgentAiChat = async (page: Page) => {
  await page.getByRole('button', { name: 'SOS' }).click();
  await page.getByRole('button', { name: /AI/ }).click();
  await expect(page.locator('label').first()).toBeVisible({ timeout: 30000 });
};

const chooseFirstUrgencyOption = async (page: Page) => {
  await page.locator('label')
    .first()
    .locator('xpath=following-sibling::div//button')
    .first()
    .click();
};

const openComparisonTray = async (page: Page) => {
  const floatingCompareButton = page.locator('div.absolute.bottom-20.left-0.right-0 > button').first();
  if (await floatingCompareButton.isVisible().catch(() => false)) {
    await floatingCompareButton.click();
    return;
  }

  const toastActionButton = page.locator('button').filter({
    has: page.locator('span.absolute.-top-1.-right-1, span.absolute.-top-1\\.5.-right-1\\.5'),
  }).first();

  await expect(toastActionButton).toBeVisible({ timeout: 30000 });
  await toastActionButton.click();
};

test.describe.serial('High risk flow: AI compare', () => {
  test.setTimeout(180000);

  test.beforeAll(async () => {
    fixture = await setupCoreFlowFixture(marker);
  });

  test.afterAll(async () => {
    if (fixture) {
      await cleanupLeads(fixture.regularUser.id);
      await teardownCoreFlowFixture(fixture);
    }
  });

  test('A-1: AI urgent search creates a lead and returns to My Page', async ({ page }) => {
    const fx = fixture!;
    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);

    await openUrgentAiChat(page);
    await chooseFirstUrgencyOption(page);
    await page.getByRole('textbox').last().fill('Seoul');
    const submitButton = page.locator('button').last();
    await expect(submitButton).toBeEnabled({ timeout: 30000 });
    await submitButton.click();

    const historyButton = page.locator('button').last();
    await expect(historyButton).toBeVisible({ timeout: 30000 });

    await historyButton.click();
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible({ timeout: 30000 });
  });

  test('A-2: facility compare opens the comparison modal and can continue to reservation', async ({ page }) => {
    const fx = fixture!;
    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    await page.getByTestId('bottom-nav-list').click();

    const cards = page.locator('[data-testid^="facility-card-"]');
    await expect(cards.nth(1)).toBeVisible({ timeout: 30000 });

    await cards.nth(0).locator('button').first().click();
    await cards.nth(1).locator('button').first().click();
    await openComparisonTray(page);

    const compareModal = page.locator('div.fixed.inset-0.z-\\[320\\]').last();
    await expect(compareModal).toBeVisible({ timeout: 30000 });

    const reserveButtons = compareModal.locator('button.w-full.py-2');
    await expect(reserveButtons.first()).toBeVisible({ timeout: 30000 });
    await reserveButtons.first().click();

    await expect(page.getByRole('heading').last()).toBeVisible({ timeout: 30000 });
  });

  test('A-3: sangjo compare opens the comparison modal and can move into company detail', async ({ page }) => {
    const fx = fixture!;
    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    await page.getByTestId('bottom-nav-funeral_companies').click();

    const companies = page.locator('.bg-white.rounded-2xl.p-2\\.5.shadow-sm.border');
    await expect(companies.nth(1)).toBeVisible({ timeout: 30000 });

    const firstCompanyName = (await companies.nth(0).locator('h3').textContent())?.trim() ?? '';
    const secondCompanyName = (await companies.nth(1).locator('h3').textContent())?.trim() ?? '';
    expect(firstCompanyName).toBeTruthy();
    expect(secondCompanyName).toBeTruthy();

    await companies.nth(0).locator('button').nth(1).click();
    await companies.nth(1).locator('button').nth(1).click();
    await openComparisonTray(page);

    const compareModal = page.locator('div.fixed.inset-0.z-\\[320\\]').last();
    await expect(compareModal).toBeVisible({ timeout: 30000 });

    const detailButtons = compareModal.locator('button.w-full.py-2\\.5');
    await expect(detailButtons.first()).toBeVisible({ timeout: 30000 });
    await detailButtons.first().click();

    const detailSheet = page.locator('div.fixed.inset-x-0.bottom-0.z-\\[250\\]');
    await expect(detailSheet).toBeVisible({ timeout: 30000 });
    await expect(detailSheet.getByRole('heading', { name: firstCompanyName })).toBeVisible({ timeout: 30000 });
  });
});
