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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key for reading

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Constants.ts 파일에서 상조 회사 목록 추출 (정규식 사용)
// 실제 constants.ts를 import하면 좋겠지만 TS 실행 환경 문제로 직접 파싱
function getConstantCompanies(): string[] {
    const constantsPath = path.resolve(rootDir, 'constants.ts');
    const content = fs.readFileSync(constantsPath, 'utf-8');

    // FUNERAL_COMPANIES 배열 찾기
    const match = content.match(/export const FUNERAL_COMPANIES: FuneralCompany\[\] = \[([\s\S]*?)\];/);
    if (!match) return [];

    const companies: string[] = [];
    const nameMatches = match[1].matchAll(/name: '([^']+)'/g);
    for (const m of nameMatches) {
        companies.push(m[1]);
    }
    return companies;
}

// 간단한 Levenshtein Distance 구현
function levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

function calculateSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    return (longer.length - levenshtein(longer, shorter)) / longer.length;
}

const normalize = (str: string) => str.replace(/\s/g, '').replace(/\(.*\)/g, '').replace(/주식회사/g, '').toLowerCase();

async function analyze() {
    console.log('🔍 상조 업체 중복 분석 시작...');

    // 1. constants.ts 데이터 로드
    const constantNames = getConstantCompanies();
    console.log(`📚 constants.ts 업체 수: ${constantNames.length}`);

    // 2. facilities DB 데이터 로드
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name, address, category')
        .or('category.eq.sangjo,name.ilike.%상조%,name.ilike.%서비스%')
        .order('name');

    if (error) {
        console.error('❌ DB Fetch Error:', error);
        return;
    }

    console.log(`💾 facilities DB 상조 관련 업체 수: ${facilities.length}`);

    // 3. 분석 및 CSV 생성
    const report: string[] = ['facility_id,facility_name,category,match_type,matched_constant_name,similarity_score,action_recommendation'];

    facilities.forEach(fac => {
        const facNorm = normalize(fac.name);
        let bestMatch = '';
        let maxScore = 0;
        let matchType = 'NONE';

        // constants 업체들과 비교
        for (const constName of constantNames) {
            const constNorm = normalize(constName);

            // 1. 완전 일치
            if (facNorm === constNorm) {
                maxScore = 1.0;
                bestMatch = constName;
                matchType = 'EXACT';
                break;
            }

            // 2. 포함 관계
            if (facNorm.includes(constNorm) || constNorm.includes(facNorm)) {
                if (calculateSimilarity(facNorm, constNorm) > maxScore) {
                    maxScore = Math.max(0.8, calculateSimilarity(facNorm, constNorm)); // 포함이면 최소 0.8
                    bestMatch = constName;
                    matchType = 'CONTAINS';
                }
            }

            // 3. 유사도 비교
            const score = calculateSimilarity(facNorm, constNorm);
            if (score > maxScore) {
                maxScore = score;
                bestMatch = constName;
                matchType = score > 0.8 ? 'HIGH_SIMILARITY' : 'LOW_SIMILARITY';
            }
        }

        // Action Recommendation
        let action = 'DELETE'; // 기본적으로 시설 테이블에서 삭제
        if (maxScore < 0.5) {
            action = 'DELETE_BUT_CHECK'; // 매칭 안되어도 상조 카테고리라면 삭제 대상이지만 확인 필요
        }

        report.push(`${fac.id},"${fac.name}",${fac.category},${matchType},"${bestMatch}",${maxScore.toFixed(2)},${action}`);
    });

    // 4. CSV 저장
    const outputPath = path.resolve(rootDir, 'data', 'sangjo_deletion_candidates.csv');
    fs.writeFileSync(outputPath, report.join('\n'));
    console.log(`✅ 분석 완료! 결과가 저장되었습니다: ${outputPath}`);

    // 요약 출력
    const matchCount = report.filter(l => l.includes('EXACT') || l.includes('HIGH_SIMILARITY')).length;
    console.log(`   - 높은 정확도 매칭: ${matchCount}개`);
    console.log(`   - 전체 삭제 대상: ${facilities.length}개`);
}

analyze();
