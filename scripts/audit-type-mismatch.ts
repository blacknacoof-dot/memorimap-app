import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// 타입별 예상 가격 키워드
const expectedKeywords: Record<string, string[]> = {
    funeral: ['빈소', '접객실', '장례식장', '임대료', '시설사용료', '1일', '시간', '호실'],
    charnel: ['봉안', '납골', '안치', '봉안함', '봉안묘', '위패', '유골함', '안치료', '영구', '봉안당', '위', '기'],
    park: ['묘지', '매장', '분묘', '평당', '㎡', '관리비', '석물', '영구사용', '단독묘', '부부묘', '잔디묘', '개인단', '부부단'],
    natural: ['수목장', '자연장', '잔디장', '화초장', '수목', '잔디형', '꽃나무', '화초형'],
    pet: ['반려', '동물', '화장', 'kg', '소동물', '대동물', '중형', '소형', '대형'],
    sea: ['해양장', '바다장', '산골', '선박'],
    complex: [] // 복합시설은 여러 타입 허용
};

// 타입 -> 이름 매핑
const typeNames: Record<string, string> = {
    funeral: '장례식장',
    charnel: '봉안시설',
    park: '공원묘지',
    natural: '자연장',
    pet: '동물장례',
    sea: '해양장',
    complex: '복합시설'
};

interface MismatchResult {
    id: string;
    name: string;
    type: string;
    typeName: string;
    priceData: any;
    detectedType: string;
    detectedTypeName: string;
    keywords: string[];
    severity: 'high' | 'medium' | 'low';
}

function detectPriceType(prices: any): { type: string; keywords: string[] } {
    if (!prices) return { type: 'unknown', keywords: [] };

    const priceStr = JSON.stringify(prices).toLowerCase();
    const foundKeywords: Record<string, string[]> = {};

    for (const [type, keywords] of Object.entries(expectedKeywords)) {
        const matches = keywords.filter(kw => priceStr.includes(kw.toLowerCase()));
        if (matches.length > 0) {
            foundKeywords[type] = matches;
        }
    }

    // 가장 많은 키워드가 매칭된 타입 찾기
    let maxType = 'unknown';
    let maxCount = 0;
    let maxKeywords: string[] = [];

    for (const [type, keywords] of Object.entries(foundKeywords)) {
        if (keywords.length > maxCount) {
            maxCount = keywords.length;
            maxType = type;
            maxKeywords = keywords;
        }
    }

    return { type: maxType, keywords: maxKeywords };
}

async function auditTypeMismatch() {
    console.log('🔍 타입-가격 불일치 전수조사 시작...\n');
    console.log('='.repeat(60) + '\n');

    // 전체 시설 가져오기 (페이지네이션)
    const facilities: any[] = [];
    const pageSize = 1000;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, type, prices')
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

    const mismatches: MismatchResult[] = [];
    const stats: Record<string, { total: number; mismatch: number; facilities: string[] }> = {};

    // 타입별 통계 초기화
    for (const type of Object.keys(typeNames)) {
        stats[type] = { total: 0, mismatch: 0, facilities: [] };
    }

    // 전수조사
    for (const f of facilities) {
        if (!f.type || !stats[f.type]) continue;

        stats[f.type].total++;

        if (!f.prices || (Array.isArray(f.prices) && f.prices.length === 0)) {
            continue; // 가격 없으면 스킵
        }

        const detected = detectPriceType(f.prices);

        // 불일치 확인 (complex는 스킵)
        if (f.type !== 'complex' && detected.type !== 'unknown' && detected.type !== f.type) {
            // 심각도 판단
            let severity: 'high' | 'medium' | 'low' = 'low';

            // 완전히 다른 카테고리면 high
            const memorialTypes = ['charnel', 'park', 'natural', 'sea'];
            const funeralTypes = ['funeral'];
            const petTypes = ['pet'];

            const actualCategory = memorialTypes.includes(f.type) ? 'memorial' :
                funeralTypes.includes(f.type) ? 'funeral' : 'pet';
            const detectedCategory = memorialTypes.includes(detected.type) ? 'memorial' :
                funeralTypes.includes(detected.type) ? 'funeral' : 'pet';

            if (actualCategory !== detectedCategory) {
                severity = 'high';
            } else if (detected.keywords.length >= 3) {
                severity = 'medium';
            }

            const mismatch: MismatchResult = {
                id: f.id,
                name: f.name,
                type: f.type,
                typeName: typeNames[f.type] || f.type,
                priceData: f.prices,
                detectedType: detected.type,
                detectedTypeName: typeNames[detected.type] || detected.type,
                keywords: detected.keywords,
                severity
            };

            mismatches.push(mismatch);
            stats[f.type].mismatch++;
            stats[f.type].facilities.push(f.name);
        }
    }

    // 보고서 생성
    let report = `# 🔍 타입-가격 데이터 불일치 전수조사 보고서\n\n`;
    report += `**조사 시간**: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `---\n\n`;

    // 요약
    const highCount = mismatches.filter(m => m.severity === 'high').length;
    const mediumCount = mismatches.filter(m => m.severity === 'medium').length;
    const lowCount = mismatches.filter(m => m.severity === 'low').length;

    report += `## 📈 전체 요약\n\n`;
    report += `- **전체 시설**: ${facilities.length}개\n`;
    report += `- **불일치 발견**: ${mismatches.length}개\n`;
    report += `  - 🔴 심각 (High): ${highCount}개\n`;
    report += `  - 🟡 주의 (Medium): ${mediumCount}개\n`;
    report += `  - 🟢 경미 (Low): ${lowCount}개\n\n`;

    // 타입별 통계
    report += `## 📊 타입별 불일치 현황\n\n`;
    report += `| 타입 | 전체 | 불일치 | 비율 |\n`;
    report += `|------|------|--------|------|\n`;
    for (const [type, data] of Object.entries(stats)) {
        const rate = data.total > 0 ? ((data.mismatch / data.total) * 100).toFixed(1) : '0';
        report += `| ${typeNames[type]} | ${data.total} | ${data.mismatch} | ${rate}% |\n`;
    }

    // 심각도별 상세 목록
    report += `\n---\n\n`;
    report += `## 🔴 심각한 불일치 (카테고리 완전 불일치)\n\n`;

    const highMismatches = mismatches.filter(m => m.severity === 'high');
    if (highMismatches.length > 0) {
        report += `> 시설 타입과 가격 데이터가 완전히 다른 카테고리\n\n`;
        report += `| # | 이름 | 현재 타입 | 가격 데이터 타입 | 감지 키워드 |\n`;
        report += `|---|------|----------|-----------------|-------------|\n`;
        highMismatches.forEach((m, i) => {
            report += `| ${i + 1} | ${m.name} | ${m.typeName} | ${m.detectedTypeName} | ${m.keywords.join(', ')} |\n`;
        });
    } else {
        report += `*심각한 불일치 없음*\n`;
    }

    report += `\n---\n\n`;
    report += `## 🟡 주의 필요 (동일 카테고리 내 불일치)\n\n`;

    const mediumMismatches = mismatches.filter(m => m.severity === 'medium');
    if (mediumMismatches.length > 0) {
        report += `| # | 이름 | 현재 타입 | 가격 데이터 타입 | 감지 키워드 |\n`;
        report += `|---|------|----------|-----------------|-------------|\n`;
        mediumMismatches.forEach((m, i) => {
            report += `| ${i + 1} | ${m.name} | ${m.typeName} | ${m.detectedTypeName} | ${m.keywords.join(', ')} |\n`;
        });
    } else {
        report += `*주의 필요 불일치 없음*\n`;
    }

    report += `\n---\n\n`;
    report += `## 🟢 경미한 불일치\n\n`;

    const lowMismatches = mismatches.filter(m => m.severity === 'low');
    if (lowMismatches.length > 0) {
        report += `| # | 이름 | 현재 타입 | 가격 데이터 타입 |\n`;
        report += `|---|------|----------|------------------|\n`;
        lowMismatches.slice(0, 50).forEach((m, i) => {
            report += `| ${i + 1} | ${m.name} | ${m.typeName} | ${m.detectedTypeName} |\n`;
        });
        if (lowMismatches.length > 50) {
            report += `\n*...외 ${lowMismatches.length - 50}개*\n`;
        }
    } else {
        report += `*경미한 불일치 없음*\n`;
    }

    // 심각한 불일치 상세 데이터
    if (highMismatches.length > 0) {
        report += `\n---\n\n`;
        report += `## 📝 심각한 불일치 상세 데이터\n\n`;

        highMismatches.forEach((m, i) => {
            report += `### ${i + 1}. ${m.name}\n\n`;
            report += `- **ID**: \`${m.id}\`\n`;
            report += `- **현재 타입**: ${m.typeName} (${m.type})\n`;
            report += `- **감지된 타입**: ${m.detectedTypeName} → **수정 필요**\n`;
            report += `- **감지 키워드**: ${m.keywords.join(', ')}\n`;
            report += `\n**가격 데이터**:\n\`\`\`json\n${JSON.stringify(m.priceData, null, 2)}\n\`\`\`\n\n`;
        });
    }

    // 파일 저장
    const reportPath = path.resolve(process.cwd(), 'scripts/type_mismatch_audit.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`✅ 보고서 저장 완료: scripts/type_mismatch_audit.md`);

    // JSON 저장 (수정 작업용)
    const jsonPath = path.resolve(process.cwd(), 'scripts/type_mismatch_data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(mismatches, null, 2), 'utf-8');
    console.log(`✅ JSON 데이터 저장: scripts/type_mismatch_data.json`);

    // 콘솔 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 전수조사 완료');
    console.log('='.repeat(60));
    console.log(`🔴 심각 (High): ${highCount}개`);
    console.log(`🟡 주의 (Medium): ${mediumCount}개`);
    console.log(`🟢 경미 (Low): ${lowCount}개`);
    console.log(`📋 총 불일치: ${mismatches.length}개 / ${facilities.length}개`);
    console.log('='.repeat(60));
}

auditTypeMismatch();
