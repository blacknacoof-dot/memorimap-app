import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import https from 'https';
import http from 'http';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 제공된 로고 정보
const LOGO_INFO = [
    { name: "더리본", logoUrl: "https://www.theribbon.co.kr/images/common/logo.png" },
    { name: "보람상조피플", logoUrl: "https://www.boram.com/images/common/logo_new.png" },
    { name: "휴먼라이프", logoUrl: "http://www.humanlife.co.kr/img/common/logo.png" },
    { name: "에이치디투어존", logoUrl: "http://www.hdtourzone.com/images/common/logo.jpg" },
    { name: "엘비라이프", logoUrl: "https://www.lblife.co.kr/images/common/logo.gif" },
    { name: "불국토", logoUrl: "http://www.bulgukto.co.kr/img/common/top_logo.gif" },
    { name: "아가페라이프", logoUrl: "http://www.agapelife.co.kr/images/common/logo.jpg" },
    { name: "보람상조", logoUrl: "https://www.boram.com/images/common/logo_new.png" },
];

// URL 유효성 테스트 함수
function testUrl(url: string): Promise<{ url: string; status: number; error?: string }> {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;

        const req = client.get(url, { timeout: 5000 }, (res) => {
            resolve({ url, status: res.statusCode || 0 });
            res.resume(); // consume response data to free up memory
        });

        req.on('error', (err) => {
            resolve({ url, status: 0, error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ url, status: 0, error: 'Timeout' });
        });
    });
}

async function verifyCompanyLogos() {
    console.log('🔍 상조 회사 로고 검증 시작\n');
    console.log('='.repeat(70));

    // 1. DB에서 실제 회사명 확인
    const { data: companies, error } = await supabase
        .from('funeral_companies')
        .select('id, name')
        .order('name');

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`\n📊 DB에 등록된 회사: ${companies?.length}개\n`);

    // 2. 제공된 로고와 DB 회사명 매칭 확인
    console.log('📋 로고 정보가 제공된 회사 확인:\n');

    const foundCompanies: string[] = [];
    const notFoundCompanies: string[] = [];

    LOGO_INFO.forEach(logo => {
        const match = companies?.find(c =>
            c.name.replace(/\s/g, '').toLowerCase() === logo.name.replace(/\s/g, '').toLowerCase()
        );

        if (match) {
            foundCompanies.push(logo.name);
            console.log(`✅ ${logo.name} (DB ID: ${match.id})`);
        } else {
            notFoundCompanies.push(logo.name);
            console.log(`❌ ${logo.name} - DB에 없음`);
        }
    });

    // 3. "우리제조상조" 확인
    console.log('\n' + '='.repeat(70));
    console.log('\n🔍 "우리제조상조" 검색 결과:\n');

    const wooriCompanies = companies?.filter(c =>
        c.name.includes('우리') || c.name.toLowerCase().includes('woori')
    );

    if (wooriCompanies && wooriCompanies.length > 0) {
        console.log(`찾은 회사 (${wooriCompanies.length}개):`);
        wooriCompanies.forEach(c => {
            console.log(`  - ${c.name} (ID: ${c.id})`);
        });
    } else {
        console.log('❌ "우리"가 포함된 회사를 찾을 수 없습니다.');
    }

    // 4. 로고 URL 유효성 테스트
    console.log('\n' + '='.repeat(70));
    console.log('\n🌐 로고 URL 유효성 테스트:\n');

    const urlTests = await Promise.all(
        LOGO_INFO.map(logo => testUrl(logo.logoUrl))
    );

    urlTests.forEach((result, index) => {
        const logoInfo = LOGO_INFO[index];
        if (result.status === 200) {
            console.log(`✅ ${logoInfo.name}: 정상 (${result.status})`);
        } else if (result.status > 0) {
            console.log(`⚠️  ${logoInfo.name}: 상태 ${result.status}`);
        } else {
            console.log(`❌ ${logoInfo.name}: 실패 (${result.error || '연결 불가'})`);
        }
    });

    // 5. 요약
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 요약:\n');
    console.log(`총 DB 회사: ${companies?.length}개`);
    console.log(`로고 정보 제공: ${LOGO_INFO.length}개`);
    console.log(`DB 매칭 성공: ${foundCompanies.length}개`);
    console.log(`DB 매칭 실패: ${notFoundCompanies.length}개`);
    console.log(`URL 유효: ${urlTests.filter(r => r.status === 200).length}개`);
    console.log(`URL 실패: ${urlTests.filter(r => r.status !== 200).length}개`);

    if (notFoundCompanies.length > 0) {
        console.log('\n⚠️  DB에 없는 회사:');
        notFoundCompanies.forEach(name => console.log(`   - ${name}`));
    }
}

verifyCompanyLogos();
