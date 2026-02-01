import { test, expect } from '@playwright/test';
import { createTestReservation, deleteTestReservations, TEST_USER_ID } from './db.utils';

// ─────────────────────────────────────────────────────────
// 수동 로그인 기반 E2E: 리뷰 삭제 검증
// 전략: 테스트 전 confirmed 예약 생성 → 리뷰 작성 가능 → 삭제 테스트
// ─────────────────────────────────────────────────────────

// 프리드라이프 실제 Facility ID (변경 필요시 이 값만 수정)
const TARGET_FACILITY_ID = 'fc_freedlife_001';

test.describe('Manual Review Deletion Verification', () => {
    // 넉넉하게 3분 타임아웃 (로그인 시간 포함)
    test.setTimeout(180000);

    // ── Test Fixture: confirmed 예약 생성 ──────────────────
    test.beforeAll(async () => {
        console.log('🛠️ Setting up test fixture: Creating confirmed reservation...');
        try {
            await createTestReservation(TEST_USER_ID, TARGET_FACILITY_ID);
            console.log('✅ Test fixture ready.');
        } catch (e) {
            console.error('❌ Fixture setup failed:', e);
            // 실패해도 테스트 진행 (실제 앱에서 확인 가능하도록)
        }
    });

    // ── Cleanup: 테스트 후 예약 삭제 ────────────────────────
    test.afterAll(async () => {
        console.log('🧹 Cleaning up test fixture...');
        await deleteTestReservations(TEST_USER_ID);
    });

    test('User manually logs in and deletes a review', async ({ page }) => {

        // ── 1. 앱 페이지로 이동 ──────────────────────────────
        await page.goto('http://localhost:5173');

        // ── 2. 수동 로그인 대기 (90초 타임아웃) ──────────────
        console.log('⚠️ [User Action Required] 브라우저에서 90초 내에 로그인을 완료해주세요.');

        // Clerk 쿠키(__client_uat)가 생길 때까지 폴링
        await expect.poll(async () => {
            const cookies = await page.context().cookies();
            return cookies.some(c => c.name.includes('__client_uat'));
        }, {
            message: 'Login timeout: User did not login within 90s',
            timeout: 90000,
            intervals: [1000]
        }).toBe(true);

        console.log('✅ Login detected! Syncing app state...');

        // 앱 상태 동기화를 위한 리로드
        await page.reload();
        await page.waitForSelector('text=상조 서비스 추천');
        await page.waitForTimeout(2000); // Hydration 대기
        console.log('✅ Ready to proceed.');

        // ── 3. 회사 시트 내 후기 탭으로 이동 ─────────────────
        const companyCard = page.locator('.bg-white.rounded-2xl').filter({ hasText: '상조' }).first();
        await companyCard.click({ force: true });

        // '후기' 탭 클릭
        await page.getByText('후기', { exact: true }).click();

        // ── 4. 후기 목록 렌더 완료 대기 ───────────────────────
        await page.waitForLoadState('networkidle');

        // ── 5. 삭제 버튼으로 소유 리뷰 탐색 ──────────────────
        const deleteButtonSelector = [
            'button:has(svg.lucide-trash)',
            'button:has(svg.lucide-trash-2)',
            'button[aria-label="삭제"]',
            'button:has-text("삭제")'
        ].join(', ');

        const deleteButtons = page.locator(deleteButtonSelector);

        console.log('Bot: Looking for deletable review...');

        // 조건부 렌더가 완료될 수 있도록 대기
        await page.waitForTimeout(2000);

        const deleteCount = await deleteButtons.count();

        // ── 6. 삭제 가능한 리뷰가 없으면 skip ─────────────────
        if (deleteCount === 0) {
            console.log('ℹ️ No deletable review found for this user. Skipping test.');
            console.log('💡 Hint: 계약 확정(confirmed) 예약이 없거나, 아직 리뷰를 작성하지 않았을 수 있습니다.');
            test.skip();
            return;
        }

        console.log(`Bot: Found ${deleteCount} deletable review(s). Targeting first one.`);

        // ── 7. 삭제 버튼 확인 및 실행 준비 ───────────────────
        const deleteBtn = deleteButtons.first();
        await expect(deleteBtn).toBeVisible({ timeout: 5000 });

        // ── 8. 삭제 실행 ──────────────────────────────────────
        console.log('Bot: Clicking delete button...');

        // native confirm/alert 자동 수락
        page.on('dialog', dialog => dialog.accept());

        await deleteBtn.click();

        // ── 9. 커스텀 확인 모달 처리 ──────────────────────────
        const confirmBtn = page
            .locator('button:has-text("확인"), button:has-text("네"), button:has-text("삭제")')
            .filter({ hasNotText: '취소' });

        const hasConfirmModal = await confirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false);
        if (hasConfirmModal) {
            console.log('Bot: Confirmation modal detected. Confirming...');
            await confirmBtn.first().click();
        }

        // ── 10. 삭제 결과 검증 ────────────────────────────────
        console.log('Bot: Verifying deletion...');

        await expect.poll(async () => {
            return await page.locator(deleteButtonSelector).count();
        }, {
            timeout: 10000,
            message: 'Delete button count did not decrease after deletion'
        }).toBeLessThan(deleteCount);

        console.log('✅ Review successfully deleted and verified.');
    });
});
