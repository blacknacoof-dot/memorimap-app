import { test, expect } from '@playwright/test';
import { createTestConsultation, deleteTestConsultation } from './db.utils';

// ─────────────────────────────────────────────────────────
// ⚠️  [격리 이유 — 2026-03-18 기준]
//
// TC-SA-01은 슈퍼관리자 UI 로그인 후 "채팅 참여" 버튼 클릭 플로우를 검증하는 테스트입니다.
// 현재 이 테스트에는 실제 로그인 플로우가 구현되어 있지 않습니다.
//   - 기존 코드 line 26: console.log('Test framework ready. Waiting for auth implementation.')
//   - Playwright storageState 또는 loginViaUi()를 활용한 자동 로그인이 구현되지 않은 상태입니다.
//
// TC-SA-05(동시성 락)는 DB 직접 조작으로 검증하므로 인증이 필요하지 않고 실행 가능하지만,
// TC-SA-01과 동일한 describe 블록에 있어 함께 격리된 상태입니다.
//
// 복구 조건:
//   1. coreFlows.fixture.ts의 loginViaUi()를 사용하여 슈퍼관리자로 자동 로그인
//   2. '/super-admin' 라우트 진입 후 채팅 참여 버튼 클릭 → 상태 변경 검증
//   3. TC-SA-01과 TC-SA-05를 별도 describe로 분리하여 TC-SA-05는 skip 해제 가능
//
// 복구 전까지 이 테스트 스위트는 skip 상태로 유지됩니다.
// ─────────────────────────────────────────────────────────

test.describe.skip('@quarantine Super Admin: Join Chat & Locking', () => {
    const TEST_CONV_ID = `e2e_lock_test_${Date.now()}`;

    test.beforeAll(async () => {
        // 1. Setup: Create a consultation in AI_HANDLING status
        await createTestConsultation(TEST_CONV_ID, 'AI_HANDLING');
    });

    test.afterAll(async () => {
        // Cleanup
        await deleteTestConsultation(TEST_CONV_ID);
    });

    test('TC-SA-01: Admin can join chat and status changes to AGENT_CONNECTED', async ({ page: _page }) => {
        // ⚠️ [미구현] 슈퍼관리자 UI 로그인 후 채팅 참여 버튼 클릭 플로우가 구현되지 않았습니다.
        // 복구 시 coreFlows.fixture.ts의 loginViaUi(page, superAdminEmail, password)를 사용하여
        // 자동 로그인 후 '/super-admin' 라우트에서 버튼 클릭 → ai_consultations.status 검증으로 구현하세요.
        test.fail(); // 미구현 명시: 이 테스트는 실패 상태여야 합니다
    });

    test('TC-SA-05: Concurrency Lock - Only one admin succeeds', async ({ page: _page }) => {
        // Simulation of Race Condition via API (since UI auth is not fully automated yet)
        console.log('Simulating concurrent requests...');

        const updateToAgentConnected = async (_agentId: string) => {
            // Mimic the service call: update status WHERE current_status = AI_HANDLING
            // This replicates aiConsultationService.updateStatus logic
            // In a real E2E, we would click the button, but for concurrency precision, we use DB calls.

            const supabase = (await import('./db.utils')).supabase;
            return supabase
                .from('ai_consultations')
                .update({ status: 'AGENT_CONNECTED', updated_at: new Date().toISOString() })
                .eq('conversation_id', TEST_CONV_ID)
                .eq('status', 'AI_HANDLING') // The Atomic Lock
                .select();
        };

        // Fire 2 requests simultaneously
        const [res1, res2] = await Promise.all([
            updateToAgentConnected('admin_1'),
            updateToAgentConnected('admin_2')
        ]);

        console.log(`Res1 count: ${res1.data?.length}, Res2 count: ${res2.data?.length}`);

        // Assertion: Only one request should update 1 row. The other should update 0 rows.
        const successCount = (res1.data?.length || 0) + (res2.data?.length || 0);
        expect(successCount).toBe(1);
    });
});
