import { expect, test } from '@playwright/test';
import { supabase } from './db.utils';
import { loginViaUi, openFixtureFacilityFromList, setupCoreFlowFixture, teardownCoreFlowFixture } from './coreFlows.fixture';

type ReservationRow = {
  id: string;
  status: string;
  payment_id: string | null;
  payment_amount: number | null;
};

const marker = `qa-master-${Date.now()}`;
let fixture: Awaited<ReturnType<typeof setupCoreFlowFixture>> | null = null;
let createdReservationId: string | null = null;

const stubPortone = async (page: import('@playwright/test').Page) => {
  await page.route('**://cdn.portone.io/v2/browser-sdk.js*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.PortOne = { requestPayment: async (params) => ({ paymentId: params.paymentId }) };',
    });
  });

  await page.route('**/functions/v1/verify-payment*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ verified: true }),
    });
  });

  await page.addInitScript(() => {
    window.PortOne = {
      requestPayment: async (params: { paymentId: string }) => ({ paymentId: params.paymentId }),
    };
  });
};

test.describe.serial('QA executable master', () => {
  test.setTimeout(180000);

  test.beforeAll(async () => {
    fixture = await setupCoreFlowFixture(marker);
  });

  test.afterAll(async () => {
    if (!fixture) return;

    if (createdReservationId) {
      await supabase.from('reservations').delete().eq('id', createdReservationId);
    }

    await teardownCoreFlowFixture(fixture);
  });

  test('P0-SEC-01 guest cannot enter super-admin route directly', async ({ page }) => {
    await page.goto('/super-admin');

    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /로그인/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /메인/ })).toBeVisible();
  });

  test('P0-SEC-02 regular user does not see super-admin entry', async ({ page }) => {
    const fx = fixture!;
    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);

    await page.getByTestId('topbar-menu-button').click();
    await expect(page.getByTestId('sidemenu-superadmin-button')).toHaveCount(0);
  });

  test('P0-BOOK-01 reservation end-to-end stores reservation row', async ({ page }) => {
    const fx = fixture!;

    await stubPortone(page);
    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);

    const openedFacilityId = await openFixtureFacilityFromList(page, fx.facilityId);
    expect(openedFacilityId).toBeTruthy();

    await page.getByTestId('facility-sheet-book-button').click();
    await expect(page.getByTestId('reservation-modal')).toBeVisible();

    await page.locator('[data-testid^="reservation-date-"]').first().click();
    await page.getByTestId('reservation-next-button').click();

    await page.locator('[data-testid^="reservation-time-"]').first().click();
    await page.getByTestId('reservation-next-button').click();

    await page.getByTestId('reservation-visitor-name').fill('QA User');
    await page.getByTestId('reservation-contact-number').fill('010-5555-6666');
    await page.locator('[data-testid^="reservation-purpose-"]').first().click();
    await page.getByTestId('reservation-next-button').click();

    await page.getByTestId('reservation-type-vip').click();
    await page.getByTestId('reservation-next-button').click();

    await expect(page.getByTestId('reservation-complete-confirm')).toBeVisible({ timeout: 30000 });
    await page.getByTestId('reservation-complete-confirm').click();

    let reservation: ReservationRow | null = null;
    await expect.poll(async () => {
      const { data } = await supabase
        .from('reservations')
        .select('id, status, payment_id, payment_amount')
        .eq('user_id', fx.regularUser.id)
        .eq('facility_id', openedFacilityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      reservation = (data as ReservationRow | null) ?? null;
      return reservation?.id ?? null;
    }, { timeout: 30000, intervals: [1000, 2000] }).not.toBeNull();

    expect(reservation).toBeTruthy();
    expect(reservation!.id).toBeTruthy();
    expect(['pending', 'confirmed']).toContain(reservation!.status);
    createdReservationId = reservation!.id;

    await page.goto('/');
    await page.getByTestId('bottom-nav-my_page').click();
    await expect(page.getByText('나의 예약 내역')).toBeVisible();
  });

  test('P1-MYPAGE-01 user can see own reservation tabs', async ({ page }) => {
    const fx = fixture!;

    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    await page.getByTestId('bottom-nav-my_page').click();

    await expect(page.getByRole('heading', { name: /예약 내역/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /상담/ })).toBeVisible();
    await expect(page.getByTitle('즐겨찾기 시설')).toBeVisible();
    await expect(page.getByTitle('즐겨찾기 상조')).toBeVisible();
  });
});
