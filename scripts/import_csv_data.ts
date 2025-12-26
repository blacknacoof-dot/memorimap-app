
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// --- 환경 변수 로드 ---
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; // Use anon if service role missing, but strict RLS might fail. Best to use Service Role for admin tasks.

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ 필수 설정(Supabase)이 누락되었습니다.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CSV_PATH = path.resolve(process.cwd(), '15774129-2025-12-22.csv');

// --- Helper Functions ---

function inferType(name: string, rawType: string): string {
    if (name.includes('장례식장') || name.includes('병원')) return 'funeral';
    if (name.includes('납골') || name.includes('봉안')) return 'charnel';
    if (name.includes('수목') || name.includes('자연')) return 'natural';
    if (name.includes('해양')) return 'sea';
    if (name.includes('공원') || name.includes('묘원')) return 'park';
    return 'funeral'; // Default
}

function parseCSVLine(line: string) {
    // Simple CSV parser handling quotes
    const result = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

async function importData() {
    console.log("🚀 CSV 데이터 가져오기 시작...");

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ CSV 파일을 찾을 수 없습니다: ${CSV_PATH}`);
        return;
    }

    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split(/\r?\n/);

    // Header: fac_type,fac_thumb src,fac_tit,fac_addr,fac_tel href,fac_tel,...

    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCSVLine(line);
        if (cols.length < 6) continue;

        // Mapping (Approximate based on CSV structure viewed)
        // 0: fac_type
        // 1: fac_thumb src (Image)
        // 2: fac_tit (Name)
        // 3: fac_addr (Address)
        // 4: fac_tel href
        // 5: fac_tel (Phone)

        const rawType = cols[0];
        const imageUrl = cols[1];
        const name = cols[2];
        const address = cols[3].replace(/"/g, ''); // Remove explicit quotes if any remains
        const phone = cols[5];

        if (!name) continue;

        const facilityType = inferType(name, rawType);

        console.log(`Processing: ${name} (${facilityType})`);

        // Check availability
        const { data: existing } = await supabase
            .from('memorial_spaces')
            .select('id')
            .eq('name', name)
            .maybeSingle();

        const payload: any = {
            name,
            address,
            phone,
            image_url: imageUrl,
            type: facilityType,
            // updated_at: new Date().toISOString(), // Removed to avoid schema error
            // Explicitly generate ID for new records if not present (Numeric string for BigInt)
            id: existing ? undefined : Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
            // Default fake coords if missing, to prevent constraints issues. 
            // In real app, we should Geocode.
            lat: existing ? undefined : 37.5,
            lng: existing ? undefined : 127.0,
            is_verified: false,
            data_source: 'public_data'
        };

        // Remove undefined keys
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        let error;
        if (existing) {
            console.log(`  ⏭️ Skipping existing record ${existing.id} (${name})`);
            // error = null; // No error, just skip
        } else {
            console.log(`  🆕 Inserting new record: ${name}`);
            const { error: insertError } = await supabase
                .from('memorial_spaces')
                .insert(payload);
            error = insertError;

            if (!error) successCount++;
        }

        if (error) {
            console.error(`  ❌ Failed: ${error.message}`);
            failCount++;
        }
    }

    console.log("------------------------------------------------");
    console.log(`작업 완료: 성공 ${successCount}, 실패 ${failCount}`);
}

importData();
