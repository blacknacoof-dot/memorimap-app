import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import https from 'https';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 새로운 로고 URL 매핑
const NEW_LOGOS = [
    {
        name: "보람상조",
        logoUrl: "https://www.boramgroup.com/images/client/mobile/kor/img/boram_logo2.png"
    },
    {
        name: "아가페라이프",
        logoUrl: "https://static1.squarespace.com/static/6201b122fc32e4424b26cca9/t/6201b18a63b8a526d4a22d80/1768487743661/"
    },
    {
        name: "보람상조피플",
        logoUrl: "https://www.boramgroup.com/images/client/mobile/kor/img/boram_logo1.png"
    },
    {
        name: "엘비라이프",
        logoUrl: "https://elbeelife.com/home/elbee/images/elbee_ci_03.gif"
    }
];

// URL 유효성 테스트
function testUrl(url: string): Promise<{ url: string; status: number; error?: string }> {
    return new Promise((resolve) => {
        const parsedUrl = new URL(url);

        https.get(url, { timeout: 5000 }, (res) => {
            resolve({ url, status: res.statusCode || 0 });
            res.resume();
        }).on('error', (err) => {
            resolve({ url, status: 0, error: err.message });
        }).on('timeout', function () {
            this.destroy();
            resolve({ url, status: 0, error: 'Timeout' });
        });
    });
}

async function updateCompanyLogos() {
    console.log('🔍 새로운 로고 URL 검증 및 업데이트\n');
    console.log('='.repeat(70));

    // 1. URL 유효성 테스트
    console.log('\n🌐 로고 URL 유효성 테스트:\n');

    const urlTests = await Promise.all(
        NEW_LOGOS.map(logo => testUrl(logo.logoUrl))
    );

    const validLogos: typeof NEW_LOGOS = [];

    urlTests.forEach((result, index) => {
        const logoInfo = NEW_LOGOS[index];
        if (result.status === 200) {
            console.log(`✅ ${logoInfo.name}: 정상 (${result.status})`);
            validLogos.push(logoInfo);
        } else if (result.status > 0 && result.status < 400) {
            console.log(`⚠️  ${logoInfo.name}: 리다이렉트 (${result.status}) - 업데이트 진행`);
            validLogos.push(logoInfo);
        } else {
            console.log(`❌ ${logoInfo.name}: 실패 (${result.error || `상태 ${result.status}`})`);
        }
    });

    // 2. DB 업데이트
    console.log('\n' + '='.repeat(70));
    console.log('\n📝 DB 업데이트:\n');

    let successCount = 0;
    let failCount = 0;

    for (const logo of validLogos) {
        // 회사 찾기
        const { data: companies } = await supabase
            .from('funeral_companies')
            .select('id, name, image_url')
            .ilike('name', `%${logo.name}%`);

        if (!companies || companies.length === 0) {
            console.log(`❌ ${logo.name}: DB에서 찾을 수 없음`);
            failCount++;
            continue;
        }

        const company = companies[0];

        // 업데이트
        const { error } = await supabase
            .from('funeral_companies')
            .update({ image_url: logo.logoUrl })
            .eq('id', company.id);

        if (error) {
            console.log(`❌ ${logo.name}: 업데이트 실패 - ${error.message}`);
            failCount++;
        } else {
            console.log(`✅ ${logo.name}: 업데이트 완료`);
            console.log(`   이전: ${company.image_url}`);
            console.log(`   새로: ${logo.logoUrl}`);
            successCount++;
        }
    }

    // 3. 요약
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 업데이트 요약:\n');
    console.log(`총 제공된 로고: ${NEW_LOGOS.length}개`);
    console.log(`유효한 URL: ${validLogos.length}개`);
    console.log(`업데이트 성공: ${successCount}개`);
    console.log(`업데이트 실패: ${failCount}개`);
}

updateCompanyLogos();
