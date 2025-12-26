
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function analyzeDuplicates() {
    console.log("🔍 주소 중복 데이터 분석 중...\n");

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type, is_verified, data_source')
        .not('address', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    const addrMap = new Map<string, any[]>();

    // Normalize address for comparison (remove spaces, parentheses content?)
    // User asked "Same Address" or "Nearby/Same Floor".
    // Let's stick to exact string match or simplified string match first.

    facilities?.forEach(f => {
        if (!f.address) return;
        // Simple normalization: remove spaces
        const key = f.address.replace(/\s+/g, '').trim();
        if (!addrMap.has(key)) {
            addrMap.set(key, []);
        }
        addrMap.get(key)?.push(f);
    });

    let dupCount = 0;
    console.log("=== 중복 주소 의심 시설 목록 ===\n");

    for (const [key, list] of addrMap.entries()) {
        if (list.length > 1) {
            // Check if they are actually different facilities (different names)
            const names = list.map(f => f.name);
            const distinctNames = new Set(names);

            // If Names are very similar, likely true duplicate.
            // If Names are different (e.g. Hall A, Hall B), might be valid co-location.

            console.log(`📍 주소: ${list[0].address} (총 ${list.length}개)`);
            list.forEach(f => {
                const idStr = String(f.id);
                console.log(`   - [${f.type}] ${f.name} (ID: ${idStr.slice(0, 6)}.., Verified: ${f.is_verified})`);
            });
            console.log('-----------------------------------');
            dupCount++;
        }
    }

    if (dupCount === 0) {
        console.log("✅ 중복된 주소를 가진 시설이 발견되지 않았습니다.");
    } else {
        console.log(`\n⚠️  총 ${dupCount}개의 주소에서 중복/복수 시설이 발견되었습니다.`);
    }
}

analyzeDuplicates();
