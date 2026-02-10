import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_CATEGORIES = ['pet_funeral', 'cemetery', 'natural_burial'];
const CATEGORY_NAMES: Record<string, string> = {
    'pet_funeral': '동물장례',
    'cemetery': '공원묘지',
    'natural_burial': '자연장'
};

interface Facility {
    id: string;
    name: string;
    images: string[] | null;
}

async function analyzeImageOverlap() {
    console.log('🔍 카테고리별 이미지 사용 현황 분석 중... (facilities.images 컬럼 분석)\n');

    const categoryImages: Record<string, string[]> = {};
    const imageCounts: Record<string, Record<string, number>> = {}; // url -> { category: count }

    for (const category of TARGET_CATEGORIES) {
        // facilities 테이블의 images 컬럼 조회
        const { data: facilities, error } = await supabase
            .from('facilities')
            .select('id, name, images')
            .eq('category', category);

        if (error) {
            console.error(`❌ Error fetching ${category}:`, error);
            continue;
        }

        const urls: string[] = [];
        (facilities as Facility[]).forEach(f => {
            if (f.images && Array.isArray(f.images) && f.images.length > 0) {
                // 대표 이미지(첫 번째)만 분석할지, 전체 다 할지?
                // 사용자가 "기본 이미지를 같은 걸 쓰고 있는지" 물었으므로 전체 확인이 안전.
                // 하지만 보통 '기본 이미지'는 대표 이미지로 박히므로 첫번째가 중요.
                // 일단 전체를 수집합니다.
                f.images.forEach(url => {
                    if (url && typeof url === 'string') urls.push(url);
                });
            }
        });

        categoryImages[category] = urls;

        // Count occurrences
        urls.forEach(url => {
            if (!imageCounts[url]) imageCounts[url] = {};
            imageCounts[url][category] = (imageCounts[url][category] || 0) + 1;
        });

        console.log(`📊 [${CATEGORY_NAMES[category]}] 시설: ${facilities.length}개, 이미지(URL) 수: ${urls.length}개`);

        // 해당 카테고리에서 가장 많이 쓰인 이미지 Top 5
        const counts = urls.reduce((acc, url) => {
            acc[url] = (acc[url] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const sorted = Object.entries(counts).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).slice(0, 5);
        if (sorted.length > 0) {
            console.log(`   - 최빈 이미지 Top 5:`);
            sorted.forEach(([url, count]) => {
                console.log(`     (${count}회) ${url}`);
            });
        } else {
            console.log(`   - 이미지가 하나도 없습니다.`);
        }
        console.log('');
    }

    // 3. 교차 사용 분석
    console.log('🔄 카테고리 간 중복 사용된 이미지 확인:');
    let overlapFound = false;

    Object.entries(imageCounts).forEach(([url, counts]) => {
        const categories = Object.keys(counts);
        if (categories.length > 1) {
            // 여러 카테고리에서 사용됨
            overlapFound = true;
            const usageStr = categories.map(c => `${CATEGORY_NAMES[c]}(${counts[c]}회)`).join(', ');
            console.log(`⚠️  [중복 사용] ${url}`);
            console.log(`    사용처: ${usageStr}`);
        }
    });

    if (!overlapFound) {
        console.log('✅ 카테고리 간 중복 사용된 이미지는 발견되지 않았습니다.');
    }
}

analyzeImageOverlap();
