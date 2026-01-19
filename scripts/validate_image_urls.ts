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

// HTTP 요청으로 이미지가 실제로 로드되는지 확인
async function checkImageUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, {
            method: 'HEAD', // HEAD 요청으로 빠르게 확인
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        return response.ok; // 200-299 상태코드면 true
    } catch (error) {
        return false;
    }
}

async function validateImageUrls() {
    console.log('='.repeat(60));
    console.log('🔍 이미지 URL 유효성 검증 (Image URL Validation)');
    console.log('='.repeat(60));
    console.log();

    try {
        // 봉안시설과 장례식장만 먼저 체크 (최적화한 카테고리)
        const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, name, category, images, address')
            .in('category', ['columbarium', 'funeral_home']);

        if (error) {
            console.error('❌ Error:', error);
            return;
        }

        console.log(`📊 검증 대상: ${facilities.length}개 시설\n`);

        const brokenImages: any[] = [];
        let checked = 0;
        let working = 0;
        let broken = 0;

        console.log('🔄 이미지 URL 확인 중...\n');

        for (const facility of facilities) {
            if (!facility.images || facility.images.length === 0) {
                brokenImages.push({
                    ...facility,
                    issue: 'NO_IMAGES',
                    brokenUrls: []
                });
                broken++;
                continue;
            }

            const facilityBrokenUrls: string[] = [];

            for (const imageUrl of facility.images) {
                checked++;
                const isValid = await checkImageUrl(imageUrl);

                if (!isValid) {
                    facilityBrokenUrls.push(imageUrl);
                    broken++;
                } else {
                    working++;
                }

                // 진행상황 표시
                if (checked % 50 === 0) {
                    console.log(`   ✓ ${checked} URLs 확인됨 (작동: ${working}, 깨짐: ${broken})`);
                }
            }

            if (facilityBrokenUrls.length > 0) {
                brokenImages.push({
                    ...facility,
                    issue: 'BROKEN_URL',
                    brokenUrls: facilityBrokenUrls
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 검증 결과');
        console.log('='.repeat(60));
        console.log(`✅ 정상 작동 URL: ${working}개`);
        console.log(`❌ 깨진 URL: ${broken}개`);
        console.log(`⚠️  문제 시설: ${brokenImages.length}개`);
        console.log();

        if (brokenImages.length > 0) {
            console.log('='.repeat(60));
            console.log('⚠️  깨진 이미지가 있는 시설 목록');
            console.log('='.repeat(60));

            const columbariumBroken = brokenImages.filter(f => f.category === 'columbarium');
            const funeralBroken = brokenImages.filter(f => f.category === 'funeral_home');

            if (columbariumBroken.length > 0) {
                console.log(`\n🏛️ 봉안시설 (${columbariumBroken.length}개):`);
                columbariumBroken.forEach((f, idx) => {
                    console.log(`   ${idx + 1}. ${f.name}`);
                    console.log(`      주소: ${f.address || 'N/A'}`);
                    if (f.issue === 'NO_IMAGES') {
                        console.log(`      문제: 이미지 없음`);
                    } else {
                        console.log(`      깨진 URL: ${f.brokenUrls.length}개`);
                        f.brokenUrls.forEach((url: string) => {
                            console.log(`        - ${url.substring(0, 60)}...`);
                        });
                    }
                });
            }

            if (funeralBroken.length > 0) {
                console.log(`\n⚰️  장례식장 (${funeralBroken.length}개):`);
                funeralBroken.slice(0, 20).forEach((f, idx) => {
                    console.log(`   ${idx + 1}. ${f.name}`);
                    console.log(`      주소: ${f.address || 'N/A'}`);
                    if (f.issue === 'NO_IMAGES') {
                        console.log(`      문제: 이미지 없음`);
                    } else {
                        console.log(`      깨진 URL: ${f.brokenUrls.length}개`);
                    }
                });
                if (funeralBroken.length > 20) {
                    console.log(`   ... 외 ${funeralBroken.length - 20}개`);
                }
            }
        }

        console.log();

        // 리포트 저장
        const reportPath = path.resolve(__dirname, 'broken_urls_report.json');
        const report = {
            timestamp: new Date().toISOString(),
            totalChecked: checked,
            working: working,
            broken: broken,
            facilitiesWithIssues: brokenImages.length,
            details: brokenImages
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        console.log(`✅ 상세 리포트 저장됨: ${reportPath}`);
        console.log();

        console.log('='.repeat(60));
        console.log('💡 다음 단계');
        console.log('='.repeat(60));
        if (brokenImages.length > 0) {
            console.log('1. 깨진 이미지를 가진 시설 확인');
            console.log('2. 실제 이미지로 교체 또는 기본 이미지 할당');
            console.log('3. 외부 URL 의존성 제거 고려');
        } else {
            console.log('✅ 모든 이미지 URL이 정상 작동합니다!');
        }
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Validation failed:', error);
    }
}

validateImageUrls();
