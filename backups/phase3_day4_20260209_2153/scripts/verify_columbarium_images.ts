import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Key');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyColumbariumImages() {
    console.log('='.repeat(60));
    console.log('🔍 봉안시설 기본 이미지 검증 (Columbarium Image Verification)');
    console.log('='.repeat(60));
    console.log();

    try {
        // 1. 전체 봉안시설 조회
        const { data: allColumbarium, error: allError } = await supabase
            .from('facilities')
            .select('id, name, images, address')
            .eq('category', 'columbarium');

        if (allError) {
            console.error('❌ Error fetching facilities:', allError);
            return;
        }

        console.log(`📊 전체 봉안시설 수: ${allColumbarium.length}개`);
        console.log();

        // 2. 기본 이미지를 가진 시설 필터링 (/defaults/ 폴더)
        const defaultImageFacilities = allColumbarium.filter(f => {
            if (!f.images || f.images.length === 0) return false;
            const imagesStr = JSON.stringify(f.images);
            return imagesStr.includes('/defaults/charnel_') || imagesStr.includes('/defaults/funeral_');
        });

        console.log(`📸 기본 이미지를 가진 봉안시설: ${defaultImageFacilities.length}개`);
        console.log(`   (전체의 ${((defaultImageFacilities.length / allColumbarium.length) * 100).toFixed(1)}%)`);
        console.log();

        // 3. 이미지가 NULL이거나 빈 배열인 시설
        const noImageFacilities = allColumbarium.filter(f => !f.images || f.images.length === 0);
        console.log(`❌ 이미지가 없는 봉안시설: ${noImageFacilities.length}개`);
        console.log(`   (전체의 ${((noImageFacilities.length / allColumbarium.length) * 100).toFixed(1)}%)`);
        console.log();

        // 4. 고유 이미지를 가진 시설
        const uniqueImageFacilities = allColumbarium.filter(f => {
            if (!f.images || f.images.length === 0) return false;
            const imagesStr = JSON.stringify(f.images);
            return !imagesStr.includes('/defaults/charnel_') && !imagesStr.includes('/defaults/funeral_');
        });

        console.log(`✅ 고유 이미지를 가진 봉안시설: ${uniqueImageFacilities.length}개`);
        console.log(`   (전체의 ${((uniqueImageFacilities.length / allColumbarium.length) * 100).toFixed(1)}%)`);
        console.log();

        // 5. 기본 이미지 URL 샘플 출력
        if (defaultImageFacilities.length > 0) {
            console.log('--- 기본 이미지 URL 샘플 (10개) ---');
            defaultImageFacilities.slice(0, 10).forEach((f, idx) => {
                console.log(`${idx + 1}. ${f.name}`);
                console.log(`   주소: ${f.address || 'N/A'}`);
                console.log(`   이미지: ${f.images?.[0]?.substring(0, 80)}...`);
                console.log();
            });
        }

        // 6. 이미지 URL 패턴 분석
        const imagePatterns = new Map<string, number>();
        allColumbarium.forEach(f => {
            if (f.images && f.images.length > 0) {
                const firstImage = f.images[0];
                // Extract pattern (e.g., charnel_front_1, funeral_front_2)
                const pattern = firstImage.match(/\/(charnel_[^\/]+|funeral_[^\/]+)\./)?.[1] || 'other';
                imagePatterns.set(pattern, (imagePatterns.get(pattern) || 0) + 1);
            }
        });

        console.log('--- 이미지 패턴 분석 ---');
        const sortedPatterns = Array.from(imagePatterns.entries())
            .sort((a, b) => b[1] - a[1]);

        sortedPatterns.forEach(([pattern, count]) => {
            console.log(`${pattern}: ${count}개 시설 (${((count / allColumbarium.length) * 100).toFixed(1)}%)`);
        });
        console.log();

        // 7. 요약 통계
        console.log('='.repeat(60));
        console.log('📊 통계 요약 (Summary)');
        console.log('='.repeat(60));
        console.log(`┌─ 전체 봉안시설: ${allColumbarium.length}개`);
        console.log(`├─ 기본 이미지 사용: ${defaultImageFacilities.length}개 (${((defaultImageFacilities.length / allColumbarium.length) * 100).toFixed(1)}%)`);
        console.log(`├─ 이미지 없음: ${noImageFacilities.length}개 (${((noImageFacilities.length / allColumbarium.length) * 100).toFixed(1)}%)`);
        console.log(`└─ 고유 이미지: ${uniqueImageFacilities.length}개 (${((uniqueImageFacilities.length / allColumbarium.length) * 100).toFixed(1)}%)`);
        console.log();

        // 8. 상세 리포트 저장
        const reportPath = path.resolve(__dirname, 'columbarium_image_report.json');
        const report = {
            timestamp: new Date().toISOString(),
            totalColumbarium: allColumbarium.length,
            defaultImageCount: defaultImageFacilities.length,
            noImageCount: noImageFacilities.length,
            uniqueImageCount: uniqueImageFacilities.length,
            imagePatterns: Object.fromEntries(imagePatterns),
            facilitiesWithDefaultImages: defaultImageFacilities.map(f => ({
                id: f.id,
                name: f.name,
                address: f.address,
                firstImage: f.images?.[0]
            }))
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        console.log(`✅ 상세 리포트 저장됨: ${reportPath}`);
        console.log();

        // 9. 다음 단계 안내
        console.log('='.repeat(60));
        console.log('🚀 다음 단계 (Next Steps)');
        console.log('='.repeat(60));
        if (defaultImageFacilities.length > 0) {
            console.log('1️⃣  봉안시설용 실제 이미지 준비 (또는 장례식장 이미지 재사용)');
            console.log('2️⃣  이미지 최적화 및 업로드');
            console.log('3️⃣  SQL로 일괄 업데이트');
        } else {
            console.log('✅ 모든 봉안시설이 고유 이미지를 사용 중입니다!');
        }
        console.log();

    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyColumbariumImages();
