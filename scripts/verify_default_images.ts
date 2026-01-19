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

// 기본 이미지 URL 패턴 (Supabase 스토리지)
const DEFAULT_IMAGE_PATTERN = 'xvmpvzldezpoxxsarizm.supabase.co/storage';

async function verifyDefaultImages() {
    console.log('='.repeat(60));
    console.log('🔍 기본 사진을 가진 장례식장 검증 (Default Image Verification)');
    console.log('='.repeat(60));
    console.log();

    try {
        // 1. 전체 장례식장 조회
        const { data: allFuneralHomes, error: allError } = await supabase
            .from('facilities')
            .select('id, name, images, address')
            .eq('category', 'funeral_home');

        if (allError) {
            console.error('❌ Error fetching facilities:', allError);
            return;
        }

        console.log(`📊 전체 장례식장 수: ${allFuneralHomes.length}개`);
        console.log();

        // 2. 기본 이미지를 가진 시설 필터링 (/defaults/ 폴더만)
        const defaultImageFacilities = allFuneralHomes.filter(f => {
            if (!f.images || f.images.length === 0) return false;
            const imagesStr = JSON.stringify(f.images);
            // Only flag /defaults/ folder images
            return imagesStr.includes('/defaults/charnel_') || imagesStr.includes('/defaults/funeral_');
        });

        console.log(`📸 기본 이미지를 가진 장례식장: ${defaultImageFacilities.length}개`);
        console.log(`   (전체의 ${((defaultImageFacilities.length / allFuneralHomes.length) * 100).toFixed(1)}%)`);
        console.log();

        // 3. 이미지가 NULL이거나 빈 배열인 시설
        const noImageFacilities = allFuneralHomes.filter(f => !f.images || f.images.length === 0);
        console.log(`❌ 이미지가 없는 장례식장: ${noImageFacilities.length}개`);
        console.log(`   (전체의 ${((noImageFacilities.length / allFuneralHomes.length) * 100).toFixed(1)}%)`);
        console.log();

        // 4. 고유 이미지를 가진 시설
        const uniqueImageFacilities = allFuneralHomes.filter(f => {
            if (!f.images || f.images.length === 0) return false;
            const imagesStr = JSON.stringify(f.images);
            return !imagesStr.includes('/defaults/charnel_') && !imagesStr.includes('/defaults/funeral_');
        });

        console.log(`✅ 고유 이미지를 가진 장례식장: ${uniqueImageFacilities.length}개`);
        console.log(`   (전체의 ${((uniqueImageFacilities.length / allFuneralHomes.length) * 100).toFixed(1)}%)`);
        console.log();

        // 5. 기본 이미지 URL 샘플 출력
        if (defaultImageFacilities.length > 0) {
            console.log('--- 기본 이미지 URL 샘플 (5개) ---');
            defaultImageFacilities.slice(0, 5).forEach((f, idx) => {
                console.log(`${idx + 1}. ${f.name}`);
                console.log(`   주소: ${f.address || 'N/A'}`);
                console.log(`   이미지: ${f.images?.[0]?.substring(0, 80)}...`);
                console.log();
            });
        }

        // 6. 요약 통계
        console.log('='.repeat(60));
        console.log('📊 통계 요약 (Summary)');
        console.log('='.repeat(60));
        console.log(`┌─ 전체 장례식장: ${allFuneralHomes.length}개`);
        console.log(`├─ 기본 이미지 사용: ${defaultImageFacilities.length}개 (${((defaultImageFacilities.length / allFuneralHomes.length) * 100).toFixed(1)}%)`);
        console.log(`├─ 이미지 없음: ${noImageFacilities.length}개 (${((noImageFacilities.length / allFuneralHomes.length) * 100).toFixed(1)}%)`);
        console.log(`└─ 고유 이미지: ${uniqueImageFacilities.length}개 (${((uniqueImageFacilities.length / allFuneralHomes.length) * 100).toFixed(1)}%)`);
        console.log();

        // 7. 기본 이미지 시설 ID 목록 저장 (선택 사항)
        if (defaultImageFacilities.length > 0) {
            const reportPath = path.resolve(__dirname, 'default_image_facilities.json');
            const report = {
                timestamp: new Date().toISOString(),
                totalFuneralHomes: allFuneralHomes.length,
                defaultImageCount: defaultImageFacilities.length,
                facilities: defaultImageFacilities.map(f => ({
                    id: f.id,
                    name: f.name,
                    address: f.address,
                    firstImage: f.images?.[0]
                }))
            };

            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
            console.log(`✅ 상세 리포트 저장됨: ${reportPath}`);
            console.log();
        }

        // 8. 다음 단계 안내
        console.log('='.repeat(60));
        console.log('🚀 다음 단계 (Next Steps)');
        console.log('='.repeat(60));
        console.log('1️⃣  Supabase SQL Editor에서 아래 SQL 실행:');
        console.log('    migrations/cleanup_default_images.sql');
        console.log();
        console.log('2️⃣  실행 후 다시 이 스크립트로 검증');
        console.log('    npm run tsx scripts/verify_default_images.ts');
        console.log();

    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyDefaultImages();
