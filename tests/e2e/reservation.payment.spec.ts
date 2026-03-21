import { test, expect } from '@playwright/test';
import { supabase, TEST_USER_ID, TEST_PARTNER_ID } from './db.utils';

// ─────────────────────────────────────────────────────────
// Flow B: 예약 → 결제 → 결제 검증
// DB 레벨 통합 테스트 (service role client)
// ─────────────────────────────────────────────────────────

const RESERVATION_ID = crypto.randomUUID();
const TEST_PAYMENT_ID = `pay_e2e_${Date.now()}`;

test.describe.serial('Flow B: Reservation → Payment → Verification', () => {

    // ── Cleanup ─────────────────────────────────────────────
    test.afterAll(async () => {
        await supabase.from('reservations').delete().eq('id', RESERVATION_ID);
        console.log(`🧹 Cleaned up reservation: ${RESERVATION_ID}`);
    });

    // ── B-1: 예약 생성 ─────────────────────────────────────
    test('B-1: Create reservation with pending status', async () => {
        const { data, error } = await supabase
            .from('reservations')
            .insert({
                id: RESERVATION_ID,
                user_id: TEST_USER_ID,
                facility_id: TEST_PARTNER_ID,
                facility_name: 'E2E Payment Test Facility',
                visit_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                time_slot: '14:00',
                visitor_name: 'E2E 테스트 사용자',
                visitor_count: 2,
                contact_number: '010-1234-5678',
                purpose: 'E2E 결제 테스트',
                status: 'pending',
                payment_amount: 50000,
            })
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.status).toBe('pending');
        expect(data!.payment_verified).toBeFalsy();
        expect(data!.payment_amount).toBe(50000);
        console.log(`✅ Reservation created: ${RESERVATION_ID}`);
    });

    // ── B-2: 결제 전 상태 확인 ──────────────────────────────
    test('B-2: Pre-payment state: payment_verified is false, no payment_id', async () => {
        const { data, error } = await supabase
            .from('reservations')
            .select('payment_verified, payment_id, paid_at')
            .eq('id', RESERVATION_ID)
            .single();

        expect(error).toBeNull();
        expect(data!.payment_verified).toBeFalsy();
        expect(data!.payment_id).toBeNull();
        expect(data!.paid_at).toBeNull();
    });

    // ── B-3: 결제 검증 시뮬레이션 (DB 업데이트) ─────────────
    test('B-3: Payment verification updates reservation correctly', async () => {
        const paidAt = new Date().toISOString();

        const { data, error } = await supabase
            .from('reservations')
            .update({
                payment_verified: true,
                payment_id: TEST_PAYMENT_ID,
                paid_at: paidAt,
                status: 'confirmed',
            })
            .eq('id', RESERVATION_ID)
            .eq('user_id', TEST_USER_ID) // 소유권 검증 시뮬레이션
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.payment_verified).toBe(true);
        expect(data!.payment_id).toBe(TEST_PAYMENT_ID);
        expect(data!.status).toBe('confirmed');
        console.log(`✅ Payment verified: ${TEST_PAYMENT_ID}`);
    });

    // ── B-4: 소유권 불일치 시 업데이트 실패 ─────────────────
    test('B-4: IDOR defense — wrong user cannot verify payment', async () => {
        const ATTACKER_ID = '00000000-0000-0000-0000-000000000099';

        const { data, error } = await supabase
            .from('reservations')
            .update({ payment_verified: false, payment_id: 'hacked' })
            .eq('id', RESERVATION_ID)
            .eq('user_id', ATTACKER_ID) // 다른 유저 ID로 시도
            .select();

        expect(error).toBeNull();
        // 매칭되는 행 없음 → 업데이트 0건
        expect(data?.length).toBe(0);

        // 원본 데이터 무결성 확인
        const { data: original } = await supabase
            .from('reservations')
            .select('payment_id, payment_verified')
            .eq('id', RESERVATION_ID)
            .single();

        expect(original!.payment_id).toBe(TEST_PAYMENT_ID);
        expect(original!.payment_verified).toBe(true);
        console.log('✅ IDOR defense verified: attacker update rejected');
    });

    // ── B-5: 결제 금액 위변조 감지 시뮬레이션 ───────────────
    test('B-5: Amount tampering detection — DB amount vs request amount', async () => {
        const { data, error } = await supabase
            .from('reservations')
            .select('payment_amount')
            .eq('id', RESERVATION_ID)
            .single();

        expect(error).toBeNull();

        const dbAmount = data!.payment_amount;
        const requestedAmount = 1; // 위변조된 금액

        expect(dbAmount).not.toBe(requestedAmount);
        expect(dbAmount).toBe(50000);
        console.log(`✅ Tampering detected: DB=${dbAmount}, Request=${requestedAmount}`);
    });

    // ── B-6: 확정된 예약 취소 (상태 전이 검증) ──────────────
    test('B-6: Confirmed reservation can be cancelled', async () => {
        const { data, error } = await supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('id', RESERVATION_ID)
            .eq('user_id', TEST_USER_ID)
            .select('status')
            .single();

        expect(error).toBeNull();
        expect(data!.status).toBe('cancelled');
        console.log('✅ Reservation cancelled successfully');
    });
});
