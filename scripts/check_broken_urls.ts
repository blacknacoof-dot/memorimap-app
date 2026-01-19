import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

const CATEGORIES = ['pet_funeral', 'cemetery', 'natural_burial', 'columbarium'];

async function checkBrokenUrls() {
    console.log('🕵️‍♂️ 이미지 URL 유효성 검사 시작...');

    // 1. 대상 시설 조회
    const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, category, images')
        .in('category', CATEGORIES);

    if (!facilities) {
        console.log('시설 데이터가 없습니다.');
        return;
    }

    console.log(`총 ${facilities.length}개 시설 검사 대상.`);

    // 2. 검사 (병렬 처리 w/ concurrency limit)
    const brokenFacilities: any[] = [];
    const BATCH_SIZE = 20;

    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
        const batch = facilities.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (facility) => {
            if (!facility.images || facility.images.length === 0) return; // 이미 없으면 패스 (또는 이것도 깨진걸로 볼지?) -> 사용자가 "없는곳"도 확인해달라 함.
            // 하지만 아까 NULL 체크는 했으니 여기선 URL 깨짐 위주.

            const url = facility.images[0]; // 대표 이미지만 체크
            if (!url) return;

            // Supabase Storage 이미지는 패스 (우리가 올린 거니까)
            if (url.includes('supabase.co')) return;

            try {
                // Google URL은 HEAD 메서드 지원 안할수도 있음. GET w/ range?
                // 단순히 fetch
                const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
                if (!res.ok) {
                    process.stdout.write('x');
                    brokenFacilities.push({ ...facility, reason: `${res.status} ${res.statusText}` });
                } else {
                    process.stdout.write('.');
                }
            } catch (err: any) {
                process.stdout.write('E');
                brokenFacilities.push({ ...facility, reason: err.message || 'Fetch Error' });
            }
        });

        await Promise.all(promises);
    }

    console.log('\n\n📋 검사 결과 (깨짐 의심 시설):');
    console.log(`총 ${brokenFacilities.length}개 발견.`);

    brokenFacilities.forEach(f => {
        console.log(`   - [${f.category}] ${f.name} (ID: ${f.id})`);
        console.log(`     URL: ${f.images[0]?.substring(0, 50)}...`);
        console.log(`     Reason: ${f.reason}`);
    });

    // CSV 등으로 저장하면 더 좋지만 일단 로그로.
}

checkBrokenUrls();
