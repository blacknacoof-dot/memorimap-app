import { expect, test } from '@playwright/test';

import { supabase } from './db.utils';
import {
  CoreFlowFixture,
  loginViaUi,
  openFixtureFacilityFromList,
  setupCoreFlowFixture,
  teardownCoreFlowFixture,
} from './coreFlows.fixture';

let fixture: CoreFlowFixture | null = null;
const createdReviewIds: string[] = [];
let targetFacilityId: string | null = null;

const marker = `xss-${Date.now()}`;
const reviewPayload = [
  `${marker}-script <script>alert(1)</script>`,
  `${marker}-img <img src=x onerror=alert(1)>`,
  `${marker}-md [x](javascript:alert(1))`,
  '안전한 텍스트',
].join('\n');

test.describe.serial('security xss regression', () => {
  test.setTimeout(180000);

  test.beforeAll(async () => {
    fixture = await setupCoreFlowFixture(marker);
  });

  test.afterAll(async () => {
    if (fixture) {
      if (createdReviewIds.length > 0) {
        await supabase.from('facility_reviews').delete().in('id', createdReviewIds);
      }
      if (targetFacilityId) {
        await supabase.from('reservations').delete().eq('facility_id', targetFacilityId).eq('user_id', fixture.regularUser.id);
      }
      await teardownCoreFlowFixture(fixture);
    }
  });

  test('XSS-1: review payloads render as inert text without script, javascript links, or event handlers', async ({ page }) => {
    const fx = fixture!;
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await loginViaUi(page, fx.regularUser.email, fx.regularUser.password);
    targetFacilityId = await openFixtureFacilityFromList(page, fx.facilityId, fx.facilityName);

    await supabase.from('reservations').insert({
      id: crypto.randomUUID(),
      user_id: fx.regularUser.id,
      facility_id: targetFacilityId,
      facility_name: fx.facilityName,
      visit_date: new Date().toISOString().split('T')[0],
      time_slot: '10:00',
      visitor_name: 'Security Test User',
      visitor_count: 1,
      contact_number: '010-1234-5678',
      purpose: 'xss regression test',
      status: 'confirmed',
    });

    await page.getByTestId('facility-sheet-tab-reviews').click();

    await page.getByTestId('review-content-input').fill(reviewPayload);
    await page.getByTestId('review-submit-button').click();

    const reviewText = page.locator('p').filter({ hasText: `${marker}-script` }).first();
    await expect(reviewText).toBeVisible({ timeout: 30000 });

    const innerHtml = await reviewText.evaluate((node) => node.innerHTML);
    expect(innerHtml).not.toContain('<script');
    expect(innerHtml).not.toContain('<img');
    await expect(reviewText.locator('script')).toHaveCount(0);
    await expect(reviewText.locator('img')).toHaveCount(0);
    await expect(reviewText.locator('a[href^="javascript:"]')).toHaveCount(0);
    await expect(reviewText.locator('[onerror], [onload], [onclick]')).toHaveCount(0);

    const { data } = await supabase
      .from('facility_reviews')
      .select('id')
      .eq('user_id', fx.regularUser.id)
      .eq('facility_id', targetFacilityId!)
      .eq('content', reviewPayload.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      createdReviewIds.push(data.id);
    }

    expect(dialogTriggered).toBe(false);
    await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  });
});
