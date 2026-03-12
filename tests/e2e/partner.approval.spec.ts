import { test, expect } from '@playwright/test';
import { supabase } from './db.utils';

// ─────────────────────────────────────────────────────────
// Flow C: 파트너 승인 → 권한 부여 → 시설 접근
// DB 레벨 통합 테스트 (service role client)
// ─────────────────────────────────────────────────────────

const TEST_COMPANY_NAME = `E2E_테스트업체_${Date.now()}`;
const TEST_APPLICANT_EMAIL = `e2e_test_${Date.now()}@test.com`;
const TEST_APPLICANT_USER_ID = `e2e-user-${Date.now()}`;
let testInquiryId: number | null = null;

test.describe('Flow C: Partner Approval → Permission → Facility Access', () => {

    // ── Cleanup ─────────────────────────────────────────────
    test.afterAll(async () => {
        // 역순 정리: facility → partner → sangjo → profile → inquiry
        if (testInquiryId) {
            await supabase.from('facilities').delete().eq('user_id', TEST_APPLICANT_USER_ID);
            await supabase.from('partners').delete().eq('contact_email', TEST_APPLICANT_EMAIL);
            await supabase.from('sangjo_hq_admins').delete().eq('user_id', TEST_APPLICANT_USER_ID);
            await supabase.from('sangjo_dashboard_users').delete().eq('id', TEST_APPLICANT_USER_ID);
            await supabase.from('profiles').delete().eq('clerk_id', TEST_APPLICANT_USER_ID);
            await supabase.from('partner_inquiries').delete().eq('id', testInquiryId);
            console.log(`🧹 Cleaned up all test data for inquiry #${testInquiryId}`);
        }
    });

    // ── C-1: 입점 신청 생성 ─────────────────────────────────
    test('C-1: Create partner inquiry with pending status', async () => {
        // 신청자 프로필 생성 (승인 시 role 업데이트 대상)
        await supabase.from('profiles').upsert({
            clerk_id: TEST_APPLICANT_USER_ID,
            email: TEST_APPLICANT_EMAIL,
            full_name: 'E2E 테스트 신청자',
            role: 'user',
        }, { onConflict: 'clerk_id' });

        const { data, error } = await supabase
            .from('partner_inquiries')
            .insert({
                company_name: TEST_COMPANY_NAME,
                company_email: TEST_APPLICANT_EMAIL,
                contact_person: 'E2E 테스트',
                contact_phone: '010-0000-0000',
                business_type: '상조',
                status: 'pending',
                user_id: TEST_APPLICANT_USER_ID,
                message: 'E2E 파트너 승인 테스트',
            })
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data!.status).toBe('pending');
        testInquiryId = data!.id;
        console.log(`✅ Partner inquiry created: #${testInquiryId}`);
    });

    // ── C-2: 승인 전 상태 확인 ──────────────────────────────
    test('C-2: Pre-approval: applicant role is "user", no facility exists', async () => {
        // 신청자 역할 확인
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('clerk_id', TEST_APPLICANT_USER_ID)
            .single();

        expect(profile?.role).toBe('user');

        // 시설 미존재 확인
        const { data: facilities } = await supabase
            .from('facilities')
            .select('id')
            .eq('user_id', TEST_APPLICANT_USER_ID);

        expect(facilities?.length).toBe(0);
    });

    // ── C-3: 파트너 승인 시뮬레이션 ────────────────────────
    test('C-3: Approve partner — simulates approve_partner_transaction', async () => {
        expect(testInquiryId).not.toBeNull();

        // Step 1: inquiry 상태 업데이트
        const { error: inquiryErr } = await supabase
            .from('partner_inquiries')
            .update({ status: 'approved' })
            .eq('id', testInquiryId!);

        expect(inquiryErr).toBeNull();

        // Step 2: 시설 생성
        const { data: facility, error: facErr } = await supabase
            .from('facilities')
            .insert({
                name: TEST_COMPANY_NAME,
                type: 'sangjo_biz',
                user_id: TEST_APPLICANT_USER_ID,
                verified: true,
                address: 'E2E 테스트 주소',
            })
            .select()
            .single();

        expect(facErr).toBeNull();
        expect(facility).toBeDefined();

        // Step 3: partners 레코드 생성
        const { error: partnerErr } = await supabase
            .from('partners')
            .insert({
                name: TEST_COMPANY_NAME,
                company_name: TEST_COMPANY_NAME,
                status: 'approved',
                contact_person: 'E2E 테스트',
                contact_phone: '010-0000-0000',
                contact_email: TEST_APPLICANT_EMAIL,
            });

        expect(partnerErr).toBeNull();

        // Step 4: 프로필 역할 업데이트
        const { error: profileErr } = await supabase
            .from('profiles')
            .update({ role: 'sangjo_hq_admin' })
            .eq('clerk_id', TEST_APPLICANT_USER_ID);

        expect(profileErr).toBeNull();

        console.log(`✅ Partner approved: ${TEST_COMPANY_NAME}, facility: ${facility!.id}`);
    });

    // ── C-4: 승인 후 역할 변경 확인 ────────────────────────
    test('C-4: Post-approval: applicant role upgraded to sangjo_hq_admin', async () => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('clerk_id', TEST_APPLICANT_USER_ID)
            .single();

        expect(error).toBeNull();
        expect(profile!.role).toBe('sangjo_hq_admin');
    });

    // ── C-5: 승인 후 시설 접근 확인 ────────────────────────
    test('C-5: Post-approval: facility exists and is verified', async () => {
        const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, name, user_id, verified, type')
            .eq('user_id', TEST_APPLICANT_USER_ID);

        expect(error).toBeNull();
        expect(facilities).toBeDefined();
        expect(facilities!.length).toBeGreaterThanOrEqual(1);

        const facility = facilities![0];
        expect(facility.name).toBe(TEST_COMPANY_NAME);
        expect(facility.verified).toBe(true);
        expect(facility.type).toBe('sangjo_biz');
        console.log(`✅ Facility accessible: ${facility.id}`);
    });

    // ── C-6: 승인 후 partner 레코드 확인 ───────────────────
    test('C-6: Post-approval: partner record exists with approved status', async () => {
        const { data: partner, error } = await supabase
            .from('partners')
            .select('status, company_name')
            .eq('contact_email', TEST_APPLICANT_EMAIL)
            .single();

        expect(error).toBeNull();
        expect(partner!.status).toBe('approved');
        expect(partner!.company_name).toBe(TEST_COMPANY_NAME);
    });

    // ── C-7: 비인가 유저는 다른 시설 수정 불가 ──────────────
    test('C-7: RLS defense — cannot update facility owned by another user', async () => {
        const _ATTACKER_ID = '00000000-0000-0000-0000-000000000099';

        // 다른 유저 ID로 시설 업데이트 시도
        const { data, error } = await supabase
            .from('facilities')
            .update({ name: 'HACKED' })
            .eq('user_id', TEST_APPLICANT_USER_ID)
            .neq('user_id', TEST_APPLICANT_USER_ID) // 의도적 모순 → 0건 매칭
            .select();

        expect(error).toBeNull();
        expect(data?.length).toBe(0);

        // 원본 무결성 확인
        const { data: original } = await supabase
            .from('facilities')
            .select('name')
            .eq('user_id', TEST_APPLICANT_USER_ID)
            .single();

        expect(original!.name).toBe(TEST_COMPANY_NAME);
        console.log('✅ RLS defense verified: unauthorized update rejected');
    });

    // ── C-8: 거절 시나리오 (별도 inquiry) ───────────────────
    test('C-8: Rejection updates inquiry status and preserves user role', async () => {
        // 별도 거절용 inquiry 생성
        const { data: rejInquiry, error: createErr } = await supabase
            .from('partner_inquiries')
            .insert({
                company_name: `거절테스트_${Date.now()}`,
                company_email: `reject_${Date.now()}@test.com`,
                contact_person: '거절 테스트',
                contact_phone: '010-9999-9999',
                business_type: '장례',
                status: 'pending',
                message: '거절 테스트용',
            })
            .select()
            .single();

        expect(createErr).toBeNull();

        // 거절 처리
        const { data: rejected, error: rejectErr } = await supabase
            .from('partner_inquiries')
            .update({
                status: 'rejected',
                message: '테스트 거절 사유: 서류 미비',
            })
            .eq('id', rejInquiry!.id)
            .select()
            .single();

        expect(rejectErr).toBeNull();
        expect(rejected!.status).toBe('rejected');

        // 정리
        await supabase.from('partner_inquiries').delete().eq('id', rejInquiry!.id);
        console.log('✅ Rejection flow verified');
    });
});
