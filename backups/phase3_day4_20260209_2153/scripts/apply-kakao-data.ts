/**
 * 카카오 API 수집 데이터를 DB에 업데이트
 * - 전화번호가 없는 시설에 카카오 전화번호 추가
 * - 매칭 점수 70+ 시설만 업데이트
 * - 리뷰/점수는 업데이트하지 않음
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CollectedData {
    facility_id: number;
    facility_name: string;
    db_address: string;
    db_phone: string | null;
    kakao_name: string | null;
    kakao_address: string | null;
    kakao_phone: string | null;
    kakao_place_url: string | null;
    match_score: number;
    status: string;
}

// DRY RUN 모드 - true면 실제 업데이트 안함
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-d');
const APPLY = process.argv.includes('--apply');

async function updatePhoneNumbers() {
    console.log(`\n📞 카카오 데이터로 전화번호 업데이트`);
    console.log(`   모드: ${DRY_RUN ? '🔍 DRY RUN (검증만)' : APPLY ? '🚀 APPLY (실제 업데이트)' : '⚠️ 인자 필요: --dry-run 또는 --apply'}\n`);

    if (!DRY_RUN && !APPLY) {
        console.log('사용법:');
        console.log('  npx tsx scripts/apply-kakao-data.ts --dry-run  # 검증만');
        console.log('  npx tsx scripts/apply-kakao-data.ts --apply    # 실제 업데이트');
        return;
    }

    // 수집 데이터 로드
    const collected: CollectedData[] = JSON.parse(
        fs.readFileSync('scripts/kakao-collected-data.json', 'utf-8')
    );

    // 매칭 점수 70+ 이고 카카오 전화번호가 있고 DB 전화번호가 없는 시설
    const phoneUpdates = collected.filter(d =>
        d.match_score >= 70 &&
        d.kakao_phone &&
        d.kakao_phone.trim() !== '' &&
        (!d.db_phone || d.db_phone.trim() === '')
    );

    console.log(`📊 통계:`);
    console.log(`   총 수집 데이터: ${collected.length}개`);
    console.log(`   매칭 성공 (70+): ${collected.filter(d => d.match_score >= 70).length}개`);
    console.log(`   전화번호 업데이트 대상: ${phoneUpdates.length}개`);
    console.log('');

    if (phoneUpdates.length === 0) {
        console.log('✅ 업데이트할 전화번호가 없습니다.');
        return;
    }

    // 업데이트 미리보기
    console.log('📋 업데이트 대상 목록:');
    console.log('-'.repeat(80));
    console.log(`${'ID'.padEnd(12)} ${'시설명'.padEnd(30)} ${'카카오 전화번호'.padEnd(20)}`);
    console.log('-'.repeat(80));

    for (const d of phoneUpdates) {
        console.log(`${String(d.facility_id).padEnd(12)} ${d.facility_name.substring(0, 28).padEnd(30)} ${d.kakao_phone}`);
    }
    console.log('-'.repeat(80));
    console.log('');

    if (DRY_RUN) {
        console.log('🔍 DRY RUN 모드 - 실제 업데이트 없음');

        // 검증 리포트 저장
        let report = `# 전화번호 업데이트 검증 리포트\n\n`;
        report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
        report += `## 업데이트 대상 (${phoneUpdates.length}개)\n\n`;
        report += `| ID | 시설명 | 카카오 전화번호 | 매칭 점수 |\n`;
        report += `|-----|--------|-----------------|----------|\n`;

        for (const d of phoneUpdates) {
            report += `| ${d.facility_id} | ${d.facility_name} | ${d.kakao_phone} | ${d.match_score} |\n`;
        }

        fs.writeFileSync('scripts/phone-update-preview.md', report);
        console.log('\n📁 검증 리포트 저장됨: scripts/phone-update-preview.md');
        return;
    }

    // 실제 업데이트
    if (APPLY) {
        console.log('🚀 실제 업데이트 시작...\n');

        let success = 0;
        let failed = 0;

        for (const d of phoneUpdates) {
            const { error } = await supabase
                .from('memorial_spaces')
                .update({ phone: d.kakao_phone })
                .eq('id', d.facility_id);

            if (error) {
                console.log(`❌ 실패: ${d.facility_name} - ${error.message}`);
                failed++;
            } else {
                console.log(`✅ 성공: ${d.facility_name} → ${d.kakao_phone}`);
                success++;
            }

            // API 제한 방지
            await new Promise(r => setTimeout(r, 100));
        }

        console.log('\n' + '='.repeat(50));
        console.log(`📊 업데이트 완료!`);
        console.log(`   성공: ${success}개`);
        console.log(`   실패: ${failed}개`);
    }
}

updatePhoneNumbers().catch(console.error);
