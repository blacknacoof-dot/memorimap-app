import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNamesDistribution() {
    console.log('🔍 상조 리뷰 이름 마스킹 현황 분석 중...\n');

    // 모든 리뷰와 시설 정보를 각각 가져와서 메모리에서 조인 (PGRST200 방지)
    const { data: reviews, error: reviewsError } = await supabase
        .from('facility_reviews')
        .select('author_name, facility_id');

    const { data: facilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, type');

    if (reviewsError || facilitiesError) {
        console.error('데이터 조회 실패:', reviewsError || facilitiesError);
        return;
    }

    // 시설 정보를 ID 맵으로 변환
    const facilityMap = new Map(facilities?.map((f: any) => [f.id.toString(), f.type]));

    const sangjoReviews = reviews?.filter((r: any) => {
        const type = facilityMap.get(r.facility_id?.toString());
        return type === '상조';
    }) || [];

    console.log(`총 상조 리뷰 수: ${sangjoReviews.length}건`);

    const distribution: Record<string, number> = {};
    sangjoReviews.forEach((r: any) => {
        const name = r.author_name || 'NULL';
        distribution[name] = (distribution[name] || 0) + 1;
    });

    console.log('\n📊 이름별 분포 (상위 20개):');
    Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([name, count]) => {
            console.log(`${name.padEnd(10)}: ${count}건`);
        });

    const maskedCount = sangjoReviews.filter((r: any) => r.author_name && r.author_name.endsWith('**')).length;
    console.log(`\n✅ 마스킹 처리된 리뷰 (XX**): ${maskedCount}건 (${((maskedCount / sangjoReviews.length) * 100).toFixed(1)}%)`);
}

checkNamesDistribution();
