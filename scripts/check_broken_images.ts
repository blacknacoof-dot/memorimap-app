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

async function checkBrokenImages() {
    console.log('='.repeat(60));
    console.log('🔍 이미지 상태 검증 (Image Status Check)');
    console.log('='.repeat(60));
    console.log();

    try {
        // 모든 시설 조회
        const { data: allFacilities, error } = await supabase
            .from('facilities')
            .select('id, name, category, images, address');

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log(`📊 전체 시설 수: ${allFacilities.length}개\n`);

        // 문제 시설 분류
        const noImages = allFacilities.filter(f => !f.images || f.images.length === 0);
        const hasImages = allFacilities.filter(f => f.images && f.images.length > 0);

        // 외부 URL (정부 사이트 등)
        const externalUrls = hasImages.filter(f => {
            const imagesStr = JSON.stringify(f.images);
            return !imagesStr.includes('supabase.co');
        });

        // 기본 이미지 (defaults 폴더)
        const defaultImages = hasImages.filter(f => {
            const imagesStr = JSON.stringify(f.images);
            return imagesStr.includes('/defaults/');
        });

        console.log('='.repeat(60));
        console.log('📊 카테고리별 통계');
        console.log('='.repeat(60));

        const categories = ['funeral_home', 'columbarium', 'cemetery', 'sangjo', 'pet_funeral', 'sea_burial'];

        for (const cat of categories) {
            const catFacilities = allFacilities.filter(f => f.category === cat);
            const catNoImages = noImages.filter(f => f.category === cat);
            const catExternal = externalUrls.filter(f => f.category === cat);
            const catDefault = defaultImages.filter(f => f.category === cat);

            console.log(`\n📍 ${cat}:`);
            console.log(`   전체: ${catFacilities.length}개`);
            console.log(`   이미지 없음: ${catNoImages.length}개 ${catNoImages.length > 0 ? '⚠️' : '✅'}`);
            console.log(`   외부 URL: ${catExternal.length}개`);
            console.log(`   기본 이미지: ${catDefault.length}개 ${catDefault.length > 0 ? '⚠️' : '✅'}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('⚠️  문제가 있는 시설 상세');
        console.log('='.repeat(60));

        // 1. 이미지 없는 시설
        if (noImages.length > 0) {
            console.log(`\n❌ 이미지 없음 (${noImages.length}개):`);
            noImages.slice(0, 20).forEach((f, idx) => {
                console.log(`   ${idx + 1}. [${f.category}] ${f.name}`);
                console.log(`      주소: ${f.address || 'N/A'}`);
            });
            if (noImages.length > 20) {
                console.log(`   ... 외 ${noImages.length - 20}개`);
            }
        }

        // 2. 외부 URL 사용 시설
        if (externalUrls.length > 0) {
            console.log(`\n🔗 외부 URL 사용 (${externalUrls.length}개):`);
            externalUrls.slice(0, 10).forEach((f, idx) => {
                console.log(`   ${idx + 1}. [${f.category}] ${f.name}`);
                console.log(`      URL: ${f.images[0]?.substring(0, 60)}...`);
            });
            if (externalUrls.length > 10) {
                console.log(`   ... 외 ${externalUrls.length - 10}개`);
            }
        }

        // 3. 기본 이미지 사용 시설
        if (defaultImages.length > 0) {
            console.log(`\n🖼️  기본 이미지 사용 (${defaultImages.length}개):`);
            defaultImages.slice(0, 10).forEach((f, idx) => {
                console.log(`   ${idx + 1}. [${f.category}] ${f.name}`);
            });
            if (defaultImages.length > 10) {
                console.log(`   ... 외 ${defaultImages.length - 10}개`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📄 요약 통계');
        console.log('='.repeat(60));
        console.log(`✅ 정상 이미지: ${hasImages.length - externalUrls.length - defaultImages.length}개`);
        console.log(`⚠️  이미지 없음: ${noImages.length}개`);
        console.log(`🔗 외부 URL: ${externalUrls.length}개`);
        console.log(`🖼️  기본 이미지: ${defaultImages.length}개`);
        console.log();

        // 리포트 저장
        const reportPath = path.resolve(__dirname, 'broken_images_report.json');
        const report = {
            timestamp: new Date().toISOString(),
            total: allFacilities.length,
            noImages: {
                count: noImages.length,
                facilities: noImages.map(f => ({
                    id: f.id,
                    name: f.name,
                    category: f.category,
                    address: f.address
                }))
            },
            externalUrls: {
                count: externalUrls.length,
                facilities: externalUrls.map(f => ({
                    id: f.id,
                    name: f.name,
                    category: f.category,
                    url: f.images[0]
                }))
            },
            defaultImages: {
                count: defaultImages.length,
                facilities: defaultImages.map(f => ({
                    id: f.id,
                    name: f.name,
                    category: f.category
                }))
            }
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        console.log(`✅ 상세 리포트 저장됨: ${reportPath}`);
        console.log();

    } catch (error) {
        console.error('❌ Check failed:', error);
    }
}

checkBrokenImages();
