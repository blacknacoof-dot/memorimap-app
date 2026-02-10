
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Target facilities manually selected for the sample run
const TARGETS = [
    { name: '김화장례문화원', addressContext: '철원' },
    { name: '횡성삼성병원장례식장', addressContext: '횡성' },
    { name: '횡성장례문화센터', addressContext: '횡성' },
    { name: '양양장례문화원', addressContext: '양양' },
    { name: '교원예움 화성장례식장', addressContext: '화성' }
];

const OUTPUT_FILE = path.join(process.cwd(), 'scripts', 'crawled_sample_prices.json');

async function crawl() {
    console.log('Starting e-Sky sample crawler...');
    const browser = await chromium.launch({ headless: false }); // Visible for debugging
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = [];

    try {
        // 1. Go to the main search page
        // Note: The specific URL might need adjustment if it redirects. 
        // Usually starting at the main portal or a known search page is best.
        // e-Sky Funeral Home Info Page (This URL is a best guess based on public info, might need navigation)
        // Attempting to go to the facility info page directly.
        await page.goto('https://www.15774129.go.kr/portal/index.do');
        console.log('Navigated to portal home.');

        // Navigate to "Find Funeral Home" -> "Funeral Home Information" if needed
        // Or try to use the search directly if available on home.
        // Let's assume there's a menu or search. 
        // Looking at the standard layout: "장사시설 찾기" -> "장례식장 찾기" might be the path.
        // For robustness, let's try to find the specific URL for "Funeral Home Search"

        await page.goto('https://www.15774129.go.kr/portal/facility/funeralList.do');
        console.log('Navigated to Funeral Home List page.');

        // Wait for the search input to be ready
        await page.waitForSelector('#searchText', { timeout: 10000 }).catch(() => console.log('Search input might have different ID'));

        for (const target of TARGETS) {
            console.log(`Processing: ${target.name} (${target.addressContext})`);

            // 2. Search for the facility
            // Clear specific location filters if any, or just use name search which is usually global or flexible

            // Reset/Clear search box if needed. Assuming standard input.
            try {
                await page.fill('#searchText', target.name);
            } catch (e) {
                // Fallback selectors if #searchText isn't it
                await page.fill('input[name="searchText"]', target.name);
            }

            await page.click('.btn_search'); // Click search button (assuming class .btn_search)

            // Wait for results
            await page.waitForTimeout(2000); // Simple wait for AJAX

            // 3. Find the correct result card/link
            // We look for a link that contains the name or is within a result list item
            // Selector strategy: Find an element containing the text, click execution

            const resultLink = page.locator(`a:has-text("${target.name}")`).first();

            if (await resultLink.count() > 0) {
                console.log('  Found result, clicking...');
                await resultLink.click();
                await page.waitForLoadState('networkidle');

                // 4. Extract Price Info
                // Usually there is a tab or section for "Price Info" or "Facility Usage Fee"
                // Let's look for "가격정보" or "이용요금"

                // Sometimes it's in a tab
                const priceTab = page.locator('a:has-text("이용요금"), a:has-text("시설사용료")').first();
                if (await priceTab.isVisible()) {
                    await priceTab.click();
                    await page.waitForTimeout(1000);
                }

                // Scrape tables
                const prices = [];
                const rows = page.locator('table tbody tr');
                const rowCount = await rows.count();

                console.log(`  Found ${rowCount} rows in potential price table.`);

                for (let i = 0; i < rowCount; i++) {
                    const row = rows.nth(i);
                    const cells = await row.locator('td').allInnerTexts();
                    // Store raw rows for now to post-process or simple key-value if headers match
                    if (cells.length > 1) {
                        prices.push(cells.join(' | ')); // Simple text representation for now
                    }
                }

                results.push({
                    name: target.name,
                    addressContext: target.addressContext,
                    found: true,
                    priceData: prices
                });

                // Go back to list for next search
                await page.goto('https://www.15774129.go.kr/portal/facility/funeralList.do');

            } else {
                console.log('  Result not found in list.');
                results.push({
                    name: target.name,
                    addressContext: target.addressContext,
                    found: false,
                    priceData: []
                });
                // Ensure we are on the list page for the next loop
                if (!page.url().includes('funeralList')) {
                    await page.goto('https://www.15774129.go.kr/portal/facility/funeralList.do');
                }
            }

            // Polite delay
            await page.waitForTimeout(1000);
        }

    } catch (error) {
        console.error('Crawler failed:', error);
    } finally {
        await browser.close();

        // Save results
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
        console.log(`Saved results to ${OUTPUT_FILE}`);
    }
}

crawl();
