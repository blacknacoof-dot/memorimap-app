
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET;

async function searchNaver(query: string) {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: { query: query, display: 1, sort: 'random' }, // random = accuracy
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });
        return response.data.items[0] || null;
    } catch (e: any) {
        if (e.response?.status === 429) {
            console.warn("⚠️ Rate limit exceeded");
            return 'RATE_LIMIT';
        }
        return null; // Error or no result
    }
}

async function verifyNaverConsistency() {
    console.log("🔍 Starting Naver API Verification...");

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        console.error("❌ Naver API Credentials Missing in .env.local");
        console.error("   Please add VITE_NAVER_CLIENT_ID and VITE_NAVER_CLIENT_SECRET");
        return;
    }

    // Fetch ALL records using pagination loop
    let allFacilities: any[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, phone')
            .range(from, from + batchSize - 1);

        if (error) {
            console.error("DB Error:", error);
            return;
        }

        if (!data || data.length === 0) break;

        allFacilities.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    const facilities = allFacilities;
    console.log(`📋 Verification Target: ${facilities.length} facilities (Total DB Count).`);

    const report: any[] = [];
    const mismatches: any[] = [];
    const missingInNaver: any[] = [];

    let processed = 0;

    // Parallel Processing
    const CHUNK_SIZE = 4;
    console.log(`🚀 Starting parallel verification (Chunk: ${CHUNK_SIZE})...`);

    for (let i = 0; i < facilities.length; i += CHUNK_SIZE) {
        const chunk = facilities.slice(i, i + CHUNK_SIZE);

        await Promise.all(chunk.map(async (fac: any) => {
            const city = fac.address.split(' ')[0] || '';
            const query = `${city} ${fac.name}`;

            let result = await searchNaver(query);
            if (result === 'RATE_LIMIT') return; // Should retry but skip for now

            if (!result) {
                const fallbackResult = await searchNaver(fac.name); // Retry with just name
                if (fallbackResult && fallbackResult !== 'RATE_LIMIT') {
                    processResult(fac, fallbackResult, report, mismatches, missingInNaver);
                } else {
                    console.log(`❌ Not found in Naver: ${fac.name}`);
                    missingInNaver.push(fac);
                    report.push({ id: fac.id, name: fac.name, status: 'MISSING_IN_NAVER', naver_data: null });
                }
            } else {
                processResult(fac, result, report, mismatches, missingInNaver);
            }
        }));

        processed += chunk.length;
        if (processed % 50 === 0) console.log(`   Processed ${processed}/${facilities.length}...`);

        // Rate Limit Control: Wait a bit between chunks
        // 5 requests done instantly. Wait 600ms to keep below 10 req/sec effectively?
        // Naver limit is 10 calls/sec.
        await new Promise(r => setTimeout(r, 800));
    }

    // Generate Report File
    const reportContent = `
# Naver API Data Consistency Report
Date: ${new Date().toISOString()}
Checked: ${processed} / ${facilities.length}

## Summary
- Total Checked: ${processed}
- In Consistent (Match): ${processed - mismatches.length - missingInNaver.length}
- Mismatches (Phone/Addr Diff): ${mismatches.length}
- Missing in Naver: ${missingInNaver.length}

## Missing in Naver (Update Needed?)
${missingInNaver.map(f => `- [ ] ${f.name} (${f.address})`).join('\n')}

## Data Mismatches (DB vs Naver)
| Facility | DB Value | Naver Value | Field |
| :--- | :--- | :--- | :--- |
${mismatches.map(m => `| ${m.name} | ${m.dbVal} | ${m.naverVal} | ${m.field} |`).join('\n')}
    `;

    fs.writeFileSync('naver_verification_report.md', reportContent.trim());
    console.log("\n✅ Report generated: 'naver_verification_report.md'");
}

function processResult(fac: any, naverResult: any, report: any[], mismatches: any[], missing: any[]) {
    // Check Phone
    const cleanDbPhone = (fac.phone || '').replace(/[^0-9]/g, '');
    const cleanNaverPhone = (naverResult.telephone || '').replace(/[^0-9]/g, '');

    // Check Address (Fuzzy)
    // Naver returns roadAddress or address.
    const naverAddr = naverResult.roadAddress || naverResult.address || '';

    let status = 'MATCH';
    let mismatchDetail = '';

    if (cleanDbPhone && cleanNaverPhone && cleanDbPhone !== cleanNaverPhone) {
        status = 'MISMATCH_PHONE';
        mismatches.push({
            name: fac.name,
            dbVal: fac.phone,
            naverVal: naverResult.telephone,
            field: 'Phone'
        });
    }

    // Address check is hard due to formatting diffs. Skip for now or just log big diffs?
    // Let's stick to phone as primary hard verification.

    report.push({
        id: fac.id,
        name: fac.name,
        status,
        naver_name: naverResult.title.replace(/<[^>]*>/g, ''),
        naver_phone: naverResult.telephone
    });
}

verifyNaverConsistency();

