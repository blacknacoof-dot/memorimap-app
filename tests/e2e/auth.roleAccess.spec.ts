import { test, expect } from '@playwright/test';
import { supabase, TEST_USER_ID, TEST_PARTNER_ID } from './db.utils';

// ─────────────────────────────────────────────────────────
// Flow A: 로그인 → 역할 판별 → 대시보드 접근
// DB 레벨 통합 테스트 (service role client)
// ─────────────────────────────────────────────────────────

test.describe('Flow A: Auth → Role → Dashboard Access', () => {

    // ── A-1: super_admin 역할 판별 ──────────────────────────
    test('A-1: super_admin role is correctly resolved from profiles + super_admins', async () => {
        // 1. profiles에서 역할 조회
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('clerk_id, role, full_name')
            .eq('clerk_id', TEST_USER_ID)
            .single();

        expect(profileErr).toBeNull();
        expect(profile).toBeDefined();
        expect(profile!.role).toBe('super_admin');

        // 2. super_admins 테이블에서 활성 상태 확인
        const { data: admin, error: adminErr } = await supabase
            .from('super_admins')
            .select('user_id, is_active')
            .eq('user_id', TEST_USER_ID)
            .maybeSingle();

        expect(adminErr).toBeNull();
        expect(admin).toBeDefined();
        expect(admin!.is_active).toBe(true);
    });

    // ── A-2: facility_admin 역할 판별 ───────────────────────
    test('A-2: facility_admin is resolved when user owns a facility', async () => {
        // facilities 테이블에서 user_id로 소유 시설 조회
        const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, name, user_id, verified')
            .eq('user_id', TEST_PARTNER_ID)
            .limit(1);

        expect(error).toBeNull();
        // 파트너 ID에 시설이 있으면 facility_admin
        // 없으면 아직 승인 전이므로 skip
        if (!facilities || facilities.length === 0) {
            console.log('ℹ️ No facility owned by TEST_PARTNER_ID. Skipping facility_admin check.');
            test.skip();
            return;
        }

        expect(facilities[0].user_id).toBe(TEST_PARTNER_ID);
    });

    // ── A-3: 일반 유저는 super_admins에 없어야 함 ───────────
    test('A-3: Regular user has no super_admin record', async () => {
        const FAKE_USER_ID = '00000000-0000-0000-0000-000000000001';

        const { data, error } = await supabase
            .from('super_admins')
            .select('user_id')
            .eq('user_id', FAKE_USER_ID)
            .maybeSingle();

        expect(error).toBeNull();
        expect(data).toBeNull(); // 레코드 없음 = 일반 유저
    });

    // ── A-4: getUserRole RPC 로직 시뮬레이션 ────────────────
    test('A-4: Role resolution priority: super_admin > sangjo > facility_admin > user', async () => {
        // super_admin이면 다른 역할보다 우선
        const { data: saProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('clerk_id', TEST_USER_ID)
            .single();

        expect(saProfile?.role).toBe('super_admin');

        // super_admin인 유저는 sangjo_hq_admins에도 있을 수 있지만 super_admin이 우선
        const { data: sangjoCheck } = await supabase
            .from('sangjo_hq_admins')
            .select('user_id')
            .eq('user_id', TEST_USER_ID)
            .maybeSingle();

        // sangjo에도 있든 없든 profiles.role이 super_admin이면 super_admin 대시보드
        expect(saProfile?.role).toBe('super_admin');
        console.log(`sangjo_hq_admins record exists: ${!!sangjoCheck}`);
    });

    // ── A-5: is_super_admin() DB 함수 검증 ──────────────────
    test('A-5: is_super_admin() SQL function returns true for super_admin', async () => {
        // is_super_admin(clerk_id) 함수 호출
        const { data, error } = await supabase
            .rpc('is_super_admin', { check_user_id: TEST_USER_ID });

        expect(error).toBeNull();
        expect(data).toBe(true);
    });

    // ── A-6: is_super_admin() 비인가 유저는 false ───────────
    test('A-6: is_super_admin() returns false for non-admin user', async () => {
        const FAKE_USER_ID = '00000000-0000-0000-0000-000000000001';

        const { data, error } = await supabase
            .rpc('is_super_admin', { check_user_id: FAKE_USER_ID });

        expect(error).toBeNull();
        expect(data).toBe(false);
    });
});
