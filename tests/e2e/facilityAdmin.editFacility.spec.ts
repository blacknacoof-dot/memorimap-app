import { expect, test } from '@playwright/test';

import { supabase } from './db.utils';
import { loginViaUi } from './coreFlows.fixture';
import { createFacilityFixture, createHighRiskUser, deleteHighRiskUser, HighRiskUser } from './highRisk.helpers';

const marker = `facility-edit-${Date.now()}`;

let facilityAdmin: HighRiskUser | null = null;
let targetFacility: { id: string; name: string; type: string } | null = null;

test.describe.serial('Facility Admin: edit facility info', () => {
  test.setTimeout(180000);

  test.beforeAll(async () => {
    facilityAdmin = await createHighRiskUser('facility_admin', marker);
    targetFacility = await createFacilityFixture({
      ownerId: facilityAdmin.id,
      name: `${marker} Original Facility`,
      type: 'funeral_home',
      verified: true,
      address: '서울시 강남구 E2E 원본로 10',
    });
  });

  test.afterAll(async () => {
    if (targetFacility) {
      await supabase.from('facilities').delete().eq('id', targetFacility.id);
    }

    if (facilityAdmin) {
      await deleteHighRiskUser(facilityAdmin.id);
    }
  });

  test('FA-EDIT-01: facility admin can edit facility name and phone', async ({ page }) => {
    const admin = facilityAdmin!;
    const facility = targetFacility!;
    const updatedName = `${marker} Updated Facility`;
    const updatedPhoneInput = '0212345678';
    const updatedPhone = '021-234-5678';

    await loginViaUi(page, admin.email, admin.password);
    await page.goto('/#/facility-admin');

    await expect(page.getByRole('heading', { name: facility.name })).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('facility-edit-open-button')).toBeVisible({ timeout: 30000 });

    await page.getByTestId('facility-edit-open-button').click();
    await expect(page.getByTestId('facility-edit-modal')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('facility-edit-name-input').fill(updatedName);
    await page.getByTestId('facility-edit-phone-input').fill(updatedPhoneInput);
    await page.getByTestId('facility-edit-save-button').click();

    await expect(page.getByTestId('facility-edit-modal')).toBeHidden({ timeout: 30000 });

    await expect.poll(async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('name, phone')
        .eq('id', facility.id)
        .single();

      if (error) {
        throw new Error(`Failed to read updated facility: ${error.message}`);
      }

      return data;
    }, {
      timeout: 30000,
      intervals: [1000, 2000],
    }).toMatchObject({
      name: updatedName,
      phone: updatedPhone,
    });

    await page.reload();
    await page.goto('/#/facility-admin');

    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(updatedPhone, { exact: true })).toBeVisible({ timeout: 30000 });
  });
});
