import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

const CATEGORIES = ['pet_funeral', 'cemetery', 'natural_burial', 'columbarium'];

async function checkBrokenUrls() {
    console.log('🕵️‍♂️ 이미지 URL 유효성 검사 및 리포트 생성 시작...');

    const { data: facilities } = await supabase
        .from('facilities')
        .select('id, name, category, images')
        .in('category', CATEGORIES);

    if (!facilities) {
        console.log('시설 데이터가 없습니다.');
        return;
    }

    console.log(`총 ${facilities.length}개 시설 검사 대상.`);

    const brokenFacilities: any[] = [];
    const BATCH_SIZE = 50; // 속도를 위해 배치를 좀 늘림

    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
        const batch = facilities.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (facility) => {
            if (!facility.images || facility.images.length === 0) return;

            const url = facility.images[0];
            if (!url) return;
            if (url.includes('supabase.co')) return; // Supabase 이미지는 정상으로 가정

            try {
                // 검사 타임아웃 2초
                const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
                if (!res.ok) {
                    process.stdout.write('x');
                    brokenFacilities.push({
                        id: facility.id,
                        name: facility.name,
                        category: facility.category,
                        url: url,
                        reason: `${res.status} ${res.statusText}`
                    });
                } else {
                    process.stdout.write('.');
                }
            } catch (err: any) {
                process.stdout.write('E');
                brokenFacilities.push({
                    id: facility.id,
                    name: facility.name,
                    category: facility.category,
                    url: url,
                    reason: err.message || 'Fetch Error'
                });
            }
        });

        await Promise.all(promises);
    }

    console.log(`\n\n📋 검사 완료: 총 ${brokenFacilities.length}개 시설의 이미지가 접근 불가능합니다.`);

    // CSV 파일 생성
    if (brokenFacilities.length > 0) {
        const csvHeader = 'id,category,name,broken_url,reason\n';
        const csvRows = brokenFacilities.map(f =>
            `"${f.id}","${f.category}","${f.name}","${f.url}","${f.reason}"`
        ).join('\n');

        const reportPath = path.resolve(rootDir, 'data/broken_images_report.csv');
        fs.writeFileSync(reportPath, csvHeader + csvRows, 'utf-8');
        console.log(`📑 리포트 저장 완료: ${reportPath}`);
    } else {
        console.log('✨ 깨진 이미지가 발견되지 않았습니다.');
    }
}

checkBrokenUrls();
