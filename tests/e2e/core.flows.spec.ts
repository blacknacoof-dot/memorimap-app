import { test, expect } from '@playwright/test';
import { supabase } from './db.utils';
import {
  CoreFlowFixture,
  loginViaUi,
  openFixtureFacilityFromList,
  setupCoreFlowFixture,
  teardownCoreFlowFixture,
} from './coreFlows.fixture';

interface ReservationSnapshot {
  id: string;
  status: string;
  payment_id: string | null;
  payment_amount: number | null;
}

const marker = `c2-core-${Date.now()}`;
const SHARE_PASSWORD_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8vR4M3aMcMBXNIN1qNbfXDnpa9eKJe';

let fixture: CoreFlowFixture | null = null;
let createdReservation: ReservationSnapshot | null = null;
let createdReviewId: string | null = null;
let createdNotificationId: string | null = null;
let targetFacilityId: string | null = null;
let createdShareToken: string | null = null;

const PORTONE_STUB_SCRIPT = `
window.PortOne = {
  requestPayment: async function(params) {
    return { paymentId: params.paymentId };
  }
};
`;

test.describe.serial('TICKET-C2 core E2E release-critical flows', () => {
  test.setTimeout(180000);

  test.beforeAll(async () => {
    fixture = await setupCoreFlowFixture(marker);
  });

  test.afterAll(async () => {
    if (!fixture) return;

    if (targetFacilityId) {
      await supabase
        .from('facility_reviews')
        .delete()
        .eq('facility_id', targetFacilityId)
        .eq('user_id', fixture.regularUser.id);

      await supabase
        .from('reservations')
        .delete()
        .eq('facility_id', targetFacilityId)
        .eq('user_id', fixture.regularUser.id);
    }

    if (createdReviewId) {
      await supabase.from('facility_reviews').delete().eq('id', createdReviewId);
    }

    if (createdNotificationId) {
      await supabase.from('user_notifications').delete().eq('id', createdNotificationId);
    }

    if (createdShareToken) {
      await supabase.from('shared_journey_rate_limits').delete().eq('share_token', createdShareToken);
      await supabase.from('user_shares').delete().eq('share_token', createdShareToken);
    }

    await teardownCoreFlowFixture(fixture);
  });

  test('@release-critical C2-1: login', async ({ page }) => {
    const fx = fixture!;
    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    await expect(page.getByTestId('bottom-nav-list')).toBeVisible();
  });

  test('@release-critical C2-2: create reservation', async ({ page }) => {
    const fx = fixture!;

    await page.route('**://cdn.portone.io/v2/browser-sdk.js*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: PORTONE_STUB_SCRIPT,
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
        requestPayment: async (params) => ({ paymentId: params.paymentId }),
      };
    });

    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    targetFacilityId = await openFixtureFacilityFromList(page, fx.facilityId);
    expect(targetFacilityId).toBeTruthy();

    await page.getByTestId('facility-sheet-book-button').click();
    await expect(page.getByTestId('reservation-modal')).toBeVisible();

    await page.locator('[data-testid^="reservation-date-"]').first().click();
    await page.getByTestId('reservation-next-button').click();

    await page.locator('[data-testid^="reservation-time-"]').first().click();
    await page.getByTestId('reservation-next-button').click();

    await page.getByTestId('reservation-visitor-name').fill('E2E User');
    await page.getByTestId('reservation-contact-number').fill('010-1234-5678');
    await page.locator('[data-testid^="reservation-purpose-"]').first().click();
    await page.getByTestId('reservation-next-button').click();

    await page.getByTestId('reservation-type-vip').click();
    await page.getByTestId('reservation-next-button').click();

    await expect(page.getByTestId('reservation-complete-confirm')).toBeVisible({ timeout: 30000 });
    await page.getByTestId('reservation-complete-confirm').click();

    let latestReservation: ReservationSnapshot | null = null;
    await expect
      .poll(async () => {
        const { data } = await supabase
          .from('reservations')
          .select('id, status, payment_id, payment_amount')
          .eq('user_id', fx.regularUser.id)
          .eq('facility_id', targetFacilityId!)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        latestReservation = (data as ReservationSnapshot | null) ?? null;
        return latestReservation?.id ?? null;
      }, { timeout: 30000, intervals: [1000, 2000] })
      .not.toBeNull();

    createdReservation = latestReservation;
    expect(createdReservation?.id).toBeTruthy();
  });

  test('@release-critical C2-3: payment reflected in reservation', async () => {
    expect(createdReservation?.id).toBeTruthy();

    const { data, error } = await supabase
      .from('reservations')
      .select('id, status, payment_id, payment_amount')
      .eq('id', createdReservation!.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.payment_id).toBeTruthy();
    expect((data!.payment_amount ?? 0) > 0).toBe(true);
    expect(['pending', 'confirmed']).toContain(data!.status);
  });

  test('@release-critical C2-4: create review', async ({ page }) => {
    const fx = fixture!;
    expect(createdReservation?.id).toBeTruthy();
    expect(targetFacilityId).toBeTruthy();

    await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', createdReservation!.id);

    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    const expectedFacilityId = targetFacilityId || fx.facilityId;
    const openedFacilityId = await openFixtureFacilityFromList(page, expectedFacilityId);
    targetFacilityId = openedFacilityId;

    if (openedFacilityId !== expectedFacilityId) {
      const { data: confirmedForOpened } = await supabase
        .from('reservations')
        .select('id')
        .eq('user_id', fx.regularUser.id)
        .eq('facility_id', openedFacilityId)
        .eq('status', 'confirmed')
        .limit(1)
        .maybeSingle();

      if (!confirmedForOpened) {
        await supabase.from('reservations').insert({
          id: crypto.randomUUID(),
          user_id: fx.regularUser.id,
          facility_id: openedFacilityId,
          facility_name: `${marker} review fixture facility`,
          visit_date: new Date().toISOString().split('T')[0],
          time_slot: '10:00',
          visitor_name: 'Review E2E User',
          visitor_count: 1,
          contact_number: '010-1234-5678',
          purpose: 'review permission fixture',
          special_requests: 'review fixture',
          status: 'confirmed',
        });
      }
    }

    await supabase
      .from('facility_reviews')
      .delete()
      .eq('user_id', fx.regularUser.id)
      .eq('facility_id', openedFacilityId);

    await page.getByTestId('facility-sheet-tab-reviews').click();
    const reviewMessage = `${marker} review create verification`;
    await expect(page.getByTestId('review-content-input')).toBeVisible({ timeout: 30000 });
    await page.getByTestId('review-content-input').fill(reviewMessage);
    await page.getByTestId('review-submit-button').click();

    let reviewId: string | null = null;
    await expect
      .poll(async () => {
        const { data } = await supabase
          .from('facility_reviews')
          .select('id, content')
          .eq('user_id', fx.regularUser.id)
          .eq('facility_id', openedFacilityId)
          .ilike('content', `%${marker}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        reviewId = data?.id ?? null;
        return reviewId;
      }, { timeout: 30000, intervals: [1000, 2000] })
      .not.toBeNull();

    createdReviewId = reviewId;
    expect(createdReviewId).toBeTruthy();
  });

  test('@release-critical C2-5: admin notification deeplink', async ({ page }) => {
    const fx = fixture!;

    const { data: notification, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: fx.superAdminUser.id,
        title: `${marker} admin subs deeplink`,
        message: 'legacy /admin?tab=subs deeplink check',
        type: 'info',
        link: '/admin?tab=subs',
        is_read: false,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(notification?.id).toBeTruthy();
    createdNotificationId = notification!.id;

    await loginViaUi(page, fx.superAdminUser.email, fx.superAdminUser.password);
    await page.goto('/#/super-admin');

    await expect(page.getByTestId('notification-bell-button').first()).toBeVisible({ timeout: 30000 });
    await page.getByTestId('notification-bell-button').first().click();
    await expect(page.getByTestId('notification-modal')).toBeVisible();

    await page.getByTestId(`notification-item-${createdNotificationId}`).click();
    await expect(page).toHaveURL(/#\/super-admin\?tab=subs/);
  });

  test('@release-critical C2-6: logout then switch account and guard super-admin route', async ({ page }) => {
    const fx = fixture!;

    await loginViaUi(page, fx.superAdminUser.email, fx.superAdminUser.password);
    // loginViaUi already navigates to '/'. Redundant page.goto('/') removed: it triggers
    // a full-page reload which resets Supabase auth session restoration and makes
    // isLoggedIn transiently false, causing sidemenu-logout-button to be absent.
    await expect(page.getByTestId('topbar-menu-button')).toBeVisible({ timeout: 30000 });

    await page.getByTestId('topbar-menu-button').click();
    const logoutButton = page.getByTestId('sidemenu-logout-button');
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="sidemenu-logout-button"]') as HTMLElement | null;
      button?.click();
    });

    await expect(page.getByTestId('topbar-menu-button')).toBeVisible({ timeout: 30000 });

    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    await page.getByTestId('topbar-menu-button').click();
    await expect(page.getByTestId('sidemenu-logout-button')).toBeVisible();
    await expect(page.getByTestId('sidemenu-superadmin-button')).toHaveCount(0);
    await page.getByTestId('sidemenu-close-button').click();

    await page.goto('/#/super-admin?tab=subs');
    await expect(page.getByTestId('access-denied-super-admin')).toBeVisible({ timeout: 30000 });
  });

  test('@release-critical C2-7: share password rate limit', async () => {
    const fx = fixture!;
    const shareToken = `${marker}-share-token`;
    createdShareToken = shareToken;

    await supabase.from('shared_journey_rate_limits').delete().eq('share_token', shareToken);
    await supabase.from('user_shares').delete().eq('share_token', shareToken);

    const { error: insertError } = await supabase
      .from('user_shares')
      .insert({
        user_id: fx.regularUser.id,
        share_token: shareToken,
        share_password: SHARE_PASSWORD_HASH,
        preferences: ['funeral_home'],
        contact: '010-1111-2222',
        memo: `${marker}-memo`,
        progress_percent: 50,
        is_active: true,
      });

    expect(insertError).toBeNull();

    // ── B1-a: 5회 오입력 → RATE_LIMITED 진입 확인 ───────────────────────────
    let finalPayload: { error_code?: string; retry_after_seconds?: number; error?: string } | null = null;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const { data, error } = await supabase.rpc('get_shared_journey', {
        p_token: shareToken,
        p_password: '0000',
      });

      expect(error).toBeNull();
      const payload = (data as { error_code?: string; retry_after_seconds?: number; error?: string } | null) ?? null;
      finalPayload = payload;

      if (attempt < 5) {
        expect(payload?.error_code ?? 'INVALID_PASSWORD').toBe('INVALID_PASSWORD');
      }
    }

    expect(finalPayload?.error_code).toBe('RATE_LIMITED');
    expect((finalPayload?.retry_after_seconds ?? 0) > 0).toBe(true);

    const retryAfterSeconds = finalPayload?.retry_after_seconds ?? 0;

    // ── B1-b: lock 상태에서 추가 요청 시 여전히 RATE_LIMITED 반환 확인 ──────
    // ⚠️ 검증 범위 한계: 이 테스트는 '틀린 비밀번호'로만 검증합니다.
    //    SHARE_PASSWORD_HASH의 원문을 테스트에서 알 수 없기 때문에
    //    "올바른 비밀번호도 lock 중이면 차단된다"는 직접 증명되지 않습니다.
    //    서버가 correct password 분기만 잘못 처리해도 이 테스트는 통과할 수 있습니다.
    //    완전한 검증을 위해서는 pgcrypto로 생성한 해시와 원문 쌍이 필요합니다.
    // TODO: DB에 test_generate_hash(text) RPC 추가 후 올바른 비밀번호 테스트로 보강
    {
      const { data: lockedData, error: lockedError } = await supabase.rpc('get_shared_journey', {
        p_token: shareToken,
        p_password: 'wrong-password-during-lock',
      });
      expect(lockedError).toBeNull();
      const lockedPayload = (lockedData as { error_code?: string } | null) ?? null;
      // lock 상태에서 틀린 비밀번호 → RATE_LIMITED 반환 확인
      expect(lockedPayload?.error_code).toBe('RATE_LIMITED');
    }

    // ── B2: retry_after_seconds 경과 후 RATE_LIMITED 해제 확인 ──────────────
    // ⚠️ 검증 범위 한계: 잠금 해제 후 '틀린 비밀번호'로 INVALID_PASSWORD 반환만 확인합니다.
    //    "잠금 해제 후 올바른 비밀번호로 정상 진입"은 증명되지 않습니다.
    //    이 테스트가 보장하는 것: locked_until 만료 후 RATE_LIMITED 상태가 해제된다.
    // TODO: 올바른 비밀번호로 정상 진입(success)까지 검증하려면 위 B1-b TODO와 동일한 조건 필요
    if (retryAfterSeconds <= 10) {
      // DB에서 locked_until을 과거 시각으로 설정하여 잠금 만료 시뮬레이션
      const pastTime = new Date(Date.now() - (retryAfterSeconds + 1) * 1000).toISOString();
      await supabase
        .from('shared_journey_rate_limits')
        .update({ locked_until: pastTime })
        .eq('share_token', shareToken);

      const { data: unlockedData, error: unlockedError } = await supabase.rpc('get_shared_journey', {
        p_token: shareToken,
        p_password: '0000', // 틀린 비밀번호 — RATE_LIMITED가 아닌 INVALID_PASSWORD여야 함
      });
      expect(unlockedError).toBeNull();
      const unlockedPayload = (unlockedData as { error_code?: string } | null) ?? null;
      // 잠금 해제 후: RATE_LIMITED가 아닌 다른 에러(INVALID_PASSWORD)를 반환해야 함
      expect(unlockedPayload?.error_code).not.toBe('RATE_LIMITED');
    } else {
      // retry_after_seconds > 10초: B2 스킵 (flaky 방지)
      // 이 경우 B1-a(lock 진입)와 B1-b(lock 중 추가 요청 차단)만 검증된 상태
    }
  });
});
