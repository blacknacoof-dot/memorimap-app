import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// 장례식장 전용 키워드 (이게 있으면 장례식장 데이터)
const funeralOnlyKeywords = [
    '빈소', '접객실', '장례식장', '분향실', '특실', '일반실',
    '수의', '관', '입관', '염습', '상복', '상주', '조문객',
    '리무진', '버스', '운구', '꽃차', '영구차'
];

// 공원묘지/봉안시설 전용 키워드
const memorialOnlyKeywords = [
    '개인단', '부부단', '가족단', '봉안함', '납골함', '위패',
    '영구사용', '평당', '㎡', '묘지', '분묘'
];

interface MismatchFacility {
    id: string;
    name: string;
    type: string;
    typeName: string;
    priceInfo: any;
    hasFuneralData: boolean;
    hasMemorialData: boolean;
    funeralKeywords: string[];
    memorialKeywords: string[];
    problem: string;
}

async function auditPriceInfoMismatch() {
    console.log('🔍 price_info 데이터 불일치 전수조사 시작...\n');
    console.log('='.repeat(60) + '\n');

    // 전체 시설 가져오기 (price_info 포함)
    const facilities: any[] = [];
    const pageSize = 1000;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, type, price_info, prices')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ DB 조회 실패:', error.message);
            return;
        }

        if (data && data.length > 0) {
            facilities.push(...data);
            page++;
            hasMore = data.length === pageSize;
        } else {
            hasMore = false;
        }
    }

    console.log(`📋 전체 시설 수: ${facilities.length}개\n`);

    const typeNames: Record<string, string> = {
        funeral: '장례식장',
        charnel: '봉안시설',
        park: '공원묘지',
        natural: '자연장',
        pet: '동물장례',
        sea: '해양장',
        complex: '복합시설'
    };

    const mismatches: MismatchFacility[] = [];

    // 추모시설 타입 (장례식장 아님)
    const memorialTypes = ['charnel', 'park', 'natural', 'sea'];

    for (const f of facilities) {
        if (!f.price_info) continue;

        const priceInfoStr = JSON.stringify(f.price_info);

        // 장례식장 키워드 감지
        const foundFuneralKw = funeralOnlyKeywords.filter(kw => priceInfoStr.includes(kw));
        const foundMemorialKw = memorialOnlyKeywords.filter(kw => priceInfoStr.includes(kw));

        const hasFuneralData = foundFuneralKw.length >= 2;
        const hasMemorialData = foundMemorialKw.length >= 1;

        // 추모시설인데 장례식장 데이터가 있는 경우 (심각한 문제)
        if (memorialTypes.includes(f.type) && hasFuneralData) {
            // original_csv_name 확인
            let problem = '';
            if (f.price_info.original_csv_name === '장례식장') {
                problem = `원본 데이터가 장례식장임 (original_csv_name: "장례식장")`;
            } else if (f.price_info.source?.includes('fuzzy')) {
                problem = `퍼지 매칭으로 잘못 연결됨 (source: ${f.price_info.source})`;
            } else {
                problem = `장례식장 가격 데이터가 잘못 들어감`;
            }

            mismatches.push({
                id: f.id,
                name: f.name,
                type: f.type,
                typeName: typeNames[f.type] || f.type,
                priceInfo: f.price_info,
                hasFuneralData,
                hasMemorialData,
                funeralKeywords: foundFuneralKw,
                memorialKeywords: foundMemorialKw,
                problem
            });
        }
    }

    // 보고서 생성
    let report = `# 🔍 추모시설에 장례식장 데이터가 잘못 들어간 시설 목록\n\n`;
    report += `**조사 시간**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `---\n\n`;

    report += `## 📈 요약\n\n`;
    report += `- **전체 시설**: ${facilities.length}개\n`;
    report += `- **price_info 있는 시설**: ${facilities.filter(f => f.price_info).length}개\n`;
    report += `- **🔴 잘못된 데이터 발견**: ${mismatches.length}개\n\n`;

    // 타입별 통계
    const byType: Record<string, MismatchFacility[]> = {};
    mismatches.forEach(m => {
        if (!byType[m.type]) byType[m.type] = [];
        byType[m.type].push(m);
    });

    report += `## 📊 타입별 불일치 현황\n\n`;
    report += `| 타입 | 불일치 개수 |\n`;
    report += `|------|------------|\n`;
    for (const [type, list] of Object.entries(byType)) {
        report += `| ${typeNames[type]} | ${list.length}개 |\n`;
    }

    report += `\n---\n\n`;
    report += `## 📝 상세 목록\n\n`;
    report += `| # | 이름 | 현재 타입 | 문제점 | 감지된 장례식장 키워드 |\n`;
    report += `|---|------|----------|--------|------------------------|\n`;

    mismatches.forEach((m, i) => {
        const keywords = m.funeralKeywords.slice(0, 5).join(', ');
        report += `| ${i + 1} | ${m.name} | ${m.typeName} | ${m.problem} | ${keywords} |\n`;
    });

    // 수정용 ID 목록
    report += `\n---\n\n`;
    report += `## 🛠️ 수정 필요 시설 ID 목록\n\n`;
    report += `\`\`\`\n`;
    report += mismatches.map(m => m.id).join('\n');
    report += `\n\`\`\`\n`;

    // 파일 저장
    const reportPath = path.resolve(process.cwd(), 'scripts/price_info_mismatch_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`✅ 보고서 저장 완료: scripts/price_info_mismatch_report.md`);

    // JSON 저장 (수정 작업용)
    const jsonPath = path.resolve(process.cwd(), 'scripts/price_info_mismatch_data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(mismatches, null, 2), 'utf-8');
    console.log(`✅ JSON 데이터 저장: scripts/price_info_mismatch_data.json`);

    // 콘솔 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 전수조사 완료');
    console.log('='.repeat(60));
    console.log(`🔴 잘못된 price_info 데이터: ${mismatches.length}개`);

    for (const [type, list] of Object.entries(byType)) {
        console.log(`   - ${typeNames[type]}: ${list.length}개`);
    }
    console.log('='.repeat(60));
}

auditPriceInfoMismatch();
