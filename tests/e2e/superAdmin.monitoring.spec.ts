import { expect, test } from '@playwright/test';
import { loginViaUi } from './coreFlows.fixture';
import { supabase } from './db.utils';

interface FixtureUser {
    id: string;
    email: string;
    password: string;
}

const createSuperAdminFixtureUser = async (marker: string): Promise<FixtureUser> => {
    const token = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const email = `${marker}.super-admin.${token}@example.com`.toLowerCase();
    const password = `Monitoring!${token}Aa`;

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: `${marker}-super-admin`,
        },
    });

    if (error || !data.user?.id) {
        throw new Error(`Failed to create auth user: ${error?.message || 'unknown error'}`);
    }

    const userId = data.user.id;

    const { error: profileError } = await supabase.from('profiles').upsert(
        {
            clerk_id: userId,
            email,
            full_name: `${marker}-super-admin`,
            role: 'super_admin',
        },
        { onConflict: 'clerk_id' },
    );

    if (profileError) {
        throw new Error(`Failed to upsert profile: ${profileError.message}`);
    }

    const { error: superAdminError } = await supabase.from('super_admins').upsert(
        {
            user_id: userId,
            is_active: true,
        },
        { onConflict: 'user_id' },
    );

    if (superAdminError) {
        throw new Error(`Failed to upsert super_admin record: ${superAdminError.message}`);
    }

    return { id: userId, email, password };
};

test.describe.serial('Super Admin monitoring precision flow', () => {
    const marker = `superadmin-monitoring-${Date.now()}`;
    const facilityId = crypto.randomUUID();
    const facilityName = `${marker}-partner`;
    const contractNumber = `SC-E2E-${Date.now()}`;
    const conversationId = `monitoring_e2e_${Date.now()}`;
    const contractName = `${marker}-customer`;
    const memoText = `${marker}-memo-saved`;
    let adminUser: FixtureUser | null = null;

    test.beforeAll(async () => {
        adminUser = await createSuperAdminFixtureUser(marker);

        const facilityInsert = await supabase
            .from('facilities')
            .insert({
                id: facilityId,
                name: facilityName,
                type: 'sangjo',
                user_id: adminUser.id,
                verified: true,
                latitude: 37.5665,
                longitude: 126.978,
                address: '서울시 중구 테스트로 10',
            })
            .select('id')
            .single();

        if (facilityInsert.error || !facilityInsert.data?.id) {
            throw new Error(`Failed to create monitoring facility fixture: ${facilityInsert.error?.message || 'unknown error'}`);
        }

        const contractInsert = await supabase
            .from('sangjo_contracts')
            .insert({
                contract_number: contractNumber,
                sangjo_id: facilityId,
                customer_name: contractName,
                customer_phone: '010-1200-3400',
                total_price: 0,
                status: '상담신청',
                application_type: 'CONSULTATION',
                emergency_level: 'critical',
                region: '서울',
                service_type: '전화 상담',
                created_at: new Date().toISOString(),
            })
            .select('contract_number')
            .single();

        if (contractInsert.error || !contractInsert.data?.contract_number) {
            throw new Error(
                `Failed to create sangjo_contracts fixture: ${contractInsert.error ? JSON.stringify(contractInsert.error) : 'unknown error'}`,
            );
        }

        const inquiryInsert = await supabase.from('partner_inquiries').insert({
            user_id: adminUser.id,
            company_name: facilityName,
            manager_name: `${marker}-manager`,
            phone: '01000001111',
            email: `${marker}@example.com`,
            type: 'facility',
            inquiry_type: 'consult',
            status: 'approved',
            target_facility_id: facilityId,
            message: `${marker}-communication-fixture`,
        });

        if (inquiryInsert.error) {
            throw new Error(`Failed to create partner_inquiries fixture: ${inquiryInsert.error.message}`);
        }

        const aiInsert = await supabase.from('ai_consultations').upsert(
            {
                conversation_id: conversationId,
                user_id: adminUser.id,
                facility_id: facilityId,
                facility_name: facilityName,
                status: 'agent_requested',
                messages: [{ role: 'user', content: 'monitoring fixture message' }],
                category: 'funeral',
                space_id: `${marker}-space`,
                topic: 'general',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'conversation_id' },
        );

        if (aiInsert.error) {
            throw new Error(`Failed to create ai_consultations fixture: ${aiInsert.error.message}`);
        }
    });

    test.afterAll(async () => {
        await supabase.from('ai_consultations').delete().eq('conversation_id', conversationId);
        await supabase.from('sangjo_contracts').delete().eq('contract_number', contractNumber);
        await supabase.from('partner_inquiries').delete().eq('target_facility_id', facilityId);
        await supabase.from('facilities').delete().eq('id', facilityId);

        if (adminUser) {
            await supabase.from('super_admins').delete().eq('user_id', adminUser.id);
            await supabase.from('profiles').delete().eq('clerk_id', adminUser.id);
            await supabase.auth.admin.deleteUser(adminUser.id);
        }
    });

    test('shows monitoring cards, navigates communication, saves admin memo, and joins AI consultation', async ({ page }) => {
        await loginViaUi(page, adminUser!.email, adminUser!.password);
        await page.goto('/#/super-admin?tab=monitoring');

        await expect(page.getByText('실시간 통합 관제 시스템 가동 중')).toBeVisible();

        const contractCard = page.getByTestId(`monitoring-item-contract-${contractNumber}`);
        const aiCard = page.getByTestId(`monitoring-item-ai-${conversationId}`);

        await expect(contractCard).toBeVisible();
        await expect(contractCard).toContainText(contractName);
        await expect(contractCard).toContainText(facilityName);
        await expect(aiCard).toBeVisible();
        await expect(aiCard).toContainText(`[AI] ${facilityName}`);
        await expect(aiCard).toContainText('개입 요청');

        await page.getByTestId(`monitoring-open-communication-${contractNumber}`).click();
        await expect(page).toHaveURL(/#\/super-admin\?tab=communication/);
        await expect(page.locator('input[type="text"]').first()).toHaveValue(facilityName);
        await expect(page.getByRole('cell', { name: facilityName }).first()).toBeVisible();

        await page.goto('/#/super-admin?tab=monitoring');
        await expect(contractCard).toBeVisible();

        await page.getByTestId(`monitoring-open-contract-${contractNumber}`).click();
        await expect(page.getByTestId('contract-detail-drawer')).toBeVisible();
        await expect(page.getByTestId('contract-detail-drawer')).toContainText('계약 관제 상세');
        await page.getByTestId('contract-admin-memo').fill(memoText);
        await page.getByTestId('contract-admin-memo-save').click();

        await expect
            .poll(async () => {
                const { data } = await supabase
                    .from('sangjo_contracts')
                    .select('admin_memo')
                    .eq('contract_number', contractNumber)
                    .single();
                return data?.admin_memo ?? null;
            })
            .toBe(memoText);

        const drawer = page.getByTestId('contract-detail-drawer');
        await page.getByLabel('닫기').click();
        await expect(drawer).toHaveClass(/translate-x-full/);

        await page.getByTestId(`monitoring-join-ai-${conversationId}`).click();

        await expect
            .poll(async () => {
                const { data } = await supabase
                    .from('ai_consultations')
                    .select('status')
                    .eq('conversation_id', conversationId)
                    .single();
                return data?.status ?? null;
            })
            .toBe('agent_connected');

        await expect(aiCard).toContainText('상담 연결');
    });
});
