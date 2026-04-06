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
      id: userId,
      clerk_id: userId,
      email,
      full_name: `${marker}-super-admin`,
      role: 'super_admin',
    },
    { onConflict: 'id' },
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
        address: '서울 테스트길 10',
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
        status: '상담 접수',
        application_type: 'CONSULTATION',
        emergency_level: 'critical',
        region: '서울',
        service_type: '장례 상담',
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
  });

  test.afterAll(async () => {
    await supabase.from('sangjo_contracts').delete().eq('contract_number', contractNumber);
    await supabase.from('partner_inquiries').delete().eq('target_facility_id', facilityId);
    await supabase.from('facilities').delete().eq('id', facilityId);

    if (adminUser) {
      await supabase.from('super_admins').delete().eq('user_id', adminUser.id);
      await supabase.from('profiles').delete().eq('clerk_id', adminUser.id);
      await supabase.auth.admin.deleteUser(adminUser.id);
    }
  });

  test('shows monitoring cards, navigates communication, and saves admin memo', async ({ page }) => {
    await loginViaUi(page, adminUser!.email, adminUser!.password);
    await page.goto('/#/super-admin?tab=monitoring');
    await expect(page.getByTestId('super-admin-open-menu')).toBeVisible({ timeout: 30000 });

    const contractCard = page.getByTestId(`monitoring-item-contract-${contractNumber}`);

    await expect(contractCard).toBeVisible();
    await expect(contractCard).toContainText(contractName);
    await expect(contractCard).toContainText(facilityName);
    await expect(page.locator('[data-testid^="monitoring-item-ai-"]')).toHaveCount(0);

    await page.getByTestId(`monitoring-open-communication-${contractNumber}`).click();
    await expect(page).toHaveURL(/#\/super-admin\?tab=communication/);
    await expect(page.locator('input[type="text"]').first()).toHaveValue(facilityName);
    await expect(page.getByRole('cell', { name: facilityName }).first()).toBeVisible();

    await page.goto('/#/super-admin?tab=monitoring');
    await expect(contractCard).toBeVisible();

    await page.getByTestId(`monitoring-open-contract-${contractNumber}`).click();
    const drawer = page.getByTestId('contract-detail-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('계약 관제 상세');
    await drawer.getByTestId('contract-admin-memo').fill(memoText);

    const saveButton = drawer.getByTestId('contract-admin-memo-save');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect
      .poll(async () => {
        const { data } = await supabase
          .from('sangjo_contracts')
          .select('admin_memo')
          .eq('contract_number', contractNumber)
          .single();
        return data?.admin_memo ?? null;
      }, { timeout: 30000, intervals: [500, 1000, 2000, 3000] })
      .toBe(memoText);

    await drawer.locator('button').first().click();
    await expect(drawer).toHaveClass(/translate-x-full/);
  });
});
