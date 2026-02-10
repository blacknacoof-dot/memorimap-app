import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (value) process.env[key.trim()] = value;
            }
        });
    }
}

loadEnv();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkReviewStatus() {
    console.log("📊 [리뷰 현황 분석 시작]...");

    // 1. 전체 시설 데이터 로드 (리뷰 카운트 포함)
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, review_count');

    if (error || !facilities) {
        console.error("❌ 데이터 로드 실패:", error);
        return;
    }

    const totalCount = facilities.length;
    const withReviews = facilities.filter(f => (f.review_count || 0) > 0);
    const withoutReviews = facilities.filter(f => (f.review_count || 0) === 0);

    // 2. 유형별 통계 계산
    const typeStats: Record<string, { total: number, with: number }> = {};
    facilities.forEach(f => {
        const type = f.type || 'unknown';
        if (!typeStats[type]) typeStats[type] = { total: 0, with: 0 };
        typeStats[type].total++;
        if ((f.review_count || 0) > 0) typeStats[type].with++;
    });

    console.log(`\n--------------------------------------`);
    console.log(`📝 전체 리뷰 현황 요약`);
    console.log(`- 전체 시설: ${totalCount}건`);
    console.log(`- 리뷰 보유: ${withReviews.length}건 (${((withReviews.length / totalCount) * 100).toFixed(1)}%)`);
    console.log(`- 리뷰 없음: ${withoutReviews.length}건 (${((withoutReviews.length / totalCount) * 100).toFixed(1)}%)`);
    console.log(`--------------------------------------\n`);

    console.log(`📂 유형별 리뷰 보유율:`);
    Object.entries(typeStats).sort((a, b) => b[1].total - a[1].total).forEach(([type, stats]) => {
        const percent = ((stats.with / stats.total) * 100).toFixed(1);
        console.log(`- ${type.padEnd(8)}: ${stats.with}/${stats.total} (${percent}%)`);
    });

    if (withoutReviews.length > 0) {
        console.log(`\n🔍 리뷰가 없는 대표 시설 (Top 10):`);
        withoutReviews.slice(0, 10).forEach(f => {
            console.log(`- [${f.type}] ${f.name} (ID: ${f.id})`);
        });
    }

    console.log(`\n🚀 분석 완료!`);
}

checkReviewStatus();
