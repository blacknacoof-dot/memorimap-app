import { expect, test, Page } from '@playwright/test';

import { supabase } from './db.utils';
import { loginViaUi, setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

const marker = `ai-compare-${Date.now()}`;

let fixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;

const cleanupLeads = async (userId: string) => {
  await supabase.from('leads').delete().eq('user_id', userId);
};

const openUrgentAiChat = async (page: Page) => {
  await page.locator('#smart-search-input').fill('긴급');
  await page.getByRole('button', { name: '긴급 장례 상담' }).click();
  await expect(page.getByText('현재 상황')).toBeVisible({ timeout: 30000 });
};

const chooseFirstUrgencyOption = async (page: Page) => {
  await page.locator('label', { hasText: '현재 상황' })
    .locator('xpath=following-sibling::div//button')
    .first()
    .click();
};

const openComparisonTray = async (page: Page) => {
  const trayButton = page.locator('div.absolute.bottom-20.right-0.left-0 button').first();
  if (await trayButton.count()) {
    await trayButton.click();
    return;
  }

  await page.getByRole('button', { name: '비교하기' }).first().click();
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
    await page.locator('input[placeholder*="직접 입력"]').fill('강남구');
    await page.getByRole('button', { name: '맞춤 장례식장 찾기' }).click();

    await expect(page.getByRole('button', { name: '상담 내역 보기' })).toBeVisible({ timeout: 30000 });

    await page.getByRole('button', { name: '상담 신청' }).first().click();
    await expect(page.getByRole('button', { name: '접수 예약하기' })).toBeVisible({ timeout: 30000 });
    const urgentModal = page.locator('div.fixed.inset-0.z-\\[500\\]').first();
    const urgentTextInputs = urgentModal.locator('input[type="text"]');
    await urgentTextInputs.nth(0).fill('고인 테스트');
    await urgentTextInputs.nth(1).fill('서울아산병원 장례식장');
    await urgentTextInputs.nth(2).fill('상담 테스트');
    await urgentModal.locator('input[type="tel"]').first().fill('010-1234-5678');
    await urgentModal.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: '접수 예약하기' }).click();

    await expect.poll(async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('id')
        .eq('user_id', fx.regularUser.id)
        .eq('status', 'urgent');
      expect(error).toBeNull();
      return data?.length ?? 0;
    }, { timeout: 30000, intervals: [1000, 2000] }).toBe(1);

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, user_id, facility_id, status, visit_date, time_slot')
      .eq('user_id', fx.regularUser.id)
      .eq('status', 'urgent');

    expect(error).toBeNull();
    expect(reservations).toBeDefined();
    expect(reservations!.length).toBe(1);

    await page.getByRole('button', { name: '상담 내역 보기' }).click();
    await expect(page.getByText('나의 요금제')).toBeVisible({ timeout: 30000 });
  });

  test('A-2: facility compare opens the comparison modal and can continue to reservation', async ({ page }) => {
    const fx = fixture!;
    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    await page.getByTestId('bottom-nav-list').click();

    const cards = page.locator('[data-testid^="facility-card-"]');
    await expect(cards.nth(1)).toBeVisible({ timeout: 30000 });

    await cards.nth(0).locator('button[title="비교함에 추가"]').click();
    await cards.nth(1).locator('button[title="비교함에 추가"]').click();
    await openComparisonTray(page);

    await expect(page.getByRole('heading', { name: '시설 비교하기' })).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: '이곳으로 예약하기' }).first().click();
    await expect(page.getByRole('heading', { name: /예약/ })).toBeVisible({ timeout: 30000 });
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

    await companies.nth(0).locator('button[title="비교함에 추가"]').click();
    await companies.nth(1).locator('button[title="비교함에 추가"]').click();
    await openComparisonTray(page);

    await expect(page.getByRole('heading', { name: '상조 업체 상세 비교' })).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: '자세히 보기' }).first().click();
    await expect(page.getByText(firstCompanyName || secondCompanyName)).toBeVisible({ timeout: 30000 });
  });
});
