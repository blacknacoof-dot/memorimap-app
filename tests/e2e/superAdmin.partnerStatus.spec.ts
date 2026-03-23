import { test, expect } from '@playwright/test';
import { supabase } from './db.utils';
import { loginViaUi } from './coreFlows.fixture';

interface FixtureUser {
  id: string;
  email: string;
  password: string;
}

const randomToken = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createSuperAdminFixtureUser = async (marker: string): Promise<FixtureUser> => {
  const token = randomToken();
  const email = `${marker}.super-admin.${token}@example.com`.toLowerCase();
  const password = `PartnerStatus!${token}Aa`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user?.id) {
    throw new Error(`Failed to create fixture super_admin user: ${error?.message || 'unknown error'}`);
  }

  const userId = data.user.id;

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    clerk_id: userId,
    email,
    full_name: `${marker}-super-admin`,
    role: 'super_admin',
  }, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Failed to upsert super_admin profile: ${profileError.message}`);
  }

  const { error: superAdminError } = await supabase.from('super_admins').upsert({
    user_id: userId,
    is_active: true,
  }, { onConflict: 'user_id' });

  if (superAdminError) {
    throw new Error(`Failed to upsert super_admins fixture: ${superAdminError.message}`);
  }

  return { id: userId, email, password };
};

test.describe.serial('@release-critical Super Admin Partner Status UX', () => {
  test.setTimeout(180000);

  const marker = `partner-status-${Date.now()}`;
  const companyName = `${marker}-company`;
  const partnerId = crypto.randomUUID();
  let adminUser: FixtureUser | null = null;

  test.beforeAll(async () => {
    adminUser = await createSuperAdminFixtureUser(marker);

    const { error: partnerError } = await supabase.from('partners').insert({
      id: partnerId,
      name: companyName,
      company_name: companyName,
      status: 'approved',
      subscription_plan: 'basic',
      contact_person: 'E2E Partner Owner',
      contact_phone: '010-1234-5678',
      contact_email: `${marker}@example.com`,
      created_at: new Date().toISOString(),
    });

    if (partnerError) {
      throw new Error(`Failed to create partner fixture: ${partnerError.message}`);
    }
  });

  test.afterAll(async () => {
    await supabase.from('partners').delete().eq('id', partnerId);

    if (!adminUser) return;

    await supabase.from('super_admins').delete().eq('user_id', adminUser.id);
    await supabase.from('profiles').delete().eq('clerk_id', adminUser.id);
    await supabase.auth.admin.deleteUser(adminUser.id);
  });

  const resetPartnerStatus = async (status: 'approved' | 'suspended' | 'rejected') => {
    const updatePayload: Record<string, string | null> = {
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      approved_by: status === 'approved' ? adminUser?.id ?? null : null,
    };

    const { error } = await supabase
      .from('partners')
      .update(updatePayload)
      .eq('id', partnerId);

    expect(error).toBeNull();
  };

  const openPartnerDetailModal = async (page: import('@playwright/test').Page) => {
    await openPartnerManagementPage(page);
    await page.getByRole('button', { name: '상세보기' }).first().click();
  };

  const openPartnerManagementPage = async (page: import('@playwright/test').Page) => {
    await loginViaUi(page, adminUser!.email, adminUser!.password);
    await page.goto('/#/super-admin?tab=admissions');

    await expect(page.locator('#partner-search')).toBeVisible({ timeout: 30000 });
    await page.locator('#partner-search').fill(companyName);
    await expect(page.getByText(companyName)).toBeVisible({ timeout: 30000 });
  };

  test('cancel keeps detail modal open and confirm changes suspended status', async ({ page }) => {
    await resetPartnerStatus('approved');

    await openPartnerDetailModal(page);

    const suspendButton = page.getByRole('button', { name: '서비스 일시정지' });
    await expect(suspendButton).toBeVisible({ timeout: 30000 });

    await suspendButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-no').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expect(suspendButton).toBeVisible();

    const { data: unchangedPartner, error: unchangedError } = await supabase
      .from('partners')
      .select('status')
      .eq('id', partnerId)
      .single();

    expect(unchangedError).toBeNull();
    expect(unchangedPartner?.status).toBe('approved');

    await suspendButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expect(suspendButton).toBeHidden({ timeout: 10000 });

    await expect
      .poll(async () => {
        const { data } = await supabase
          .from('partners')
          .select('status')
          .eq('id', partnerId)
          .single();

        return data?.status ?? null;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBe('suspended');
  });

  test('cancel keeps detail modal open and confirm changes rejected status', async ({ page }) => {
    await resetPartnerStatus('approved');

    await openPartnerDetailModal(page);

    const detailModal = page.locator('.fixed.inset-0.z-\\[9999\\]');
    const rejectButton = detailModal.getByRole('button', { name: '승인 취소' });
    await expect(rejectButton).toBeVisible({ timeout: 30000 });

    await rejectButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-no').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expect(rejectButton).toBeVisible();

    const { data: unchangedPartner, error: unchangedError } = await supabase
      .from('partners')
      .select('status')
      .eq('id', partnerId)
      .single();

    expect(unchangedError).toBeNull();
    expect(unchangedPartner?.status).toBe('approved');

    await rejectButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expect(rejectButton).toBeHidden({ timeout: 10000 });

    await expect
      .poll(async () => {
        const { data } = await supabase
          .from('partners')
          .select('status')
          .eq('id', partnerId)
          .single();

        return data?.status ?? null;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBe('rejected');
  });

  test('cancel keeps detail modal open and confirm changes approved status from suspended', async ({ page }) => {
    await resetPartnerStatus('suspended');

    await openPartnerDetailModal(page);

    const detailModal = page.locator('.fixed.inset-0.z-\\[9999\\]');
    const resumeButton = detailModal.getByRole('button', { name: '서비스 재개' });
    await expect(resumeButton).toBeVisible({ timeout: 30000 });

    await resumeButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-no').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expect(resumeButton).toBeVisible();

    const { data: unchangedPartner, error: unchangedError } = await supabase
      .from('partners')
      .select('status')
      .eq('id', partnerId)
      .single();

    expect(unchangedError).toBeNull();
    expect(unchangedPartner?.status).toBe('suspended');

    await resumeButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expect(resumeButton).toBeHidden({ timeout: 10000 });

    await expect
      .poll(async () => {
        const { data } = await supabase
          .from('partners')
          .select('status')
          .eq('id', partnerId)
          .single();

        return data?.status ?? null;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBe('approved');
  });

  test('list card buttons update status without opening detail modal', async ({ page }) => {
    await resetPartnerStatus('approved');

    await openPartnerManagementPage(page);

    const partnerCard = page.locator('div.bg-white').filter({ hasText: companyName }).first();
    const suspendButton = partnerCard.getByRole('button', { name: '일시정지' });

    await expect(suspendButton).toBeVisible({ timeout: 30000 });
    await suspendButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-no').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expect(page.locator('.fixed.inset-0.z-\\[9999\\]')).toHaveCount(0);

    let { data: unchangedPartner, error: unchangedError } = await supabase
      .from('partners')
      .select('status')
      .eq('id', partnerId)
      .single();

    expect(unchangedError).toBeNull();
    expect(unchangedPartner?.status).toBe('approved');

    await suspendButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });

    await expect
      .poll(async () => {
        const { data } = await supabase
          .from('partners')
          .select('status')
          .eq('id', partnerId)
          .single();

        return data?.status ?? null;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBe('suspended');

    const resumeButton = partnerCard.getByRole('button', { name: '서비스 재개' });
    await expect(resumeButton).toBeVisible({ timeout: 30000 });
    await resumeButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-no').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });
    await expect(page.locator('.fixed.inset-0.z-\\[9999\\]')).toHaveCount(0);

    ({ data: unchangedPartner, error: unchangedError } = await supabase
      .from('partners')
      .select('status')
      .eq('id', partnerId)
      .single());

    expect(unchangedError).toBeNull();
    expect(unchangedPartner?.status).toBe('suspended');

    await resumeButton.click();
    await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('confirm-modal-yes').click();
    await expect(page.getByTestId('confirm-modal')).toBeHidden({ timeout: 10000 });

    await expect
      .poll(async () => {
        const { data } = await supabase
          .from('partners')
          .select('status')
          .eq('id', partnerId)
          .single();

        return data?.status ?? null;
      }, { timeout: 15000, intervals: [500, 1000, 2000] })
      .toBe('approved');
  });
});
