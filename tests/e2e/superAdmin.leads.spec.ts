import { expect, test } from '@playwright/test';
import { loginViaUi } from './coreFlows.fixture';
import { supabase } from './db.utils';

interface FixtureUser {
  id: string;
  email: string;
  password: string;
}

const randomToken = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createSuperAdminFixtureUser = async (marker: string): Promise<FixtureUser> => {
  const token = randomToken();
  const email = `${marker}.super-admin.${token}@example.com`.toLowerCase();
  const password = `LeadList!${token}Aa`;

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

test.describe('Super Admin Leads List', () => {
  test.setTimeout(180000);

  const marker = `superadmin-leads-${Date.now()}`;
  let adminUser: FixtureUser | null = null;
  const leadIds: string[] = [];

  const leadA = {
    contact_name: `${marker}-empty-a`,
    contact_phone: '',
    category: 'funeral',
    urgency: 'high',
    priorities: ['긴급응대'],
    context_data: { text: `${marker}-context-a` },
  };

  const leadB = {
    contact_name: `${marker}-empty-b`,
    contact_phone: '',
    category: 'memorial',
    urgency: 'medium',
    priorities: ['비교상담'],
    context_data: { text: `${marker}-context-b` },
  };

  test.beforeAll(async () => {
    adminUser = await createSuperAdminFixtureUser(marker);

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          ...leadA,
          status: 'new',
        },
        {
          ...leadB,
          status: 'contacted',
        },
      ])
      .select('id');

    if (error) {
      throw new Error(`Failed to create lead fixtures: ${error.message}`);
    }

    leadIds.push(...(data || []).map((row) => String(row.id)));
  });

  test.afterAll(async () => {
    if (leadIds.length > 0) {
      await supabase.from('leads').delete().in('id', leadIds);
    }

    if (!adminUser) return;

    await supabase.from('super_admins').delete().eq('user_id', adminUser.id);
    await supabase.from('profiles').delete().eq('clerk_id', adminUser.id);
    await supabase.auth.admin.deleteUser(adminUser.id);
  });

  test('shows seeded lead fixtures including empty-phone rows and urgency labels', async ({ page }) => {
    await loginViaUi(page, adminUser!.email, adminUser!.password);
    await page.goto('/#/super-admin?tab=leads');

    await expect(page.getByRole('heading', { name: '상담 리드 관리' })).toBeVisible({ timeout: 30000 });

    const leadARow = page.locator('tr').filter({ hasText: leadA.contact_name }).first();
    const leadBRow = page.locator('tr').filter({ hasText: leadB.contact_name }).first();

    await expect(leadARow).toBeVisible({ timeout: 30000 });
    await expect(leadBRow).toBeVisible({ timeout: 30000 });

    await expect(leadARow.getByText(leadA.context_data.text, { exact: false })).toBeVisible({ timeout: 30000 });
    await expect(leadBRow.getByText(leadB.context_data.text, { exact: false })).toBeVisible({ timeout: 30000 });

    await expect(leadARow.getByText('높음', { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(leadBRow.getByText('보통', { exact: true })).toBeVisible({ timeout: 30000 });
  });
});
