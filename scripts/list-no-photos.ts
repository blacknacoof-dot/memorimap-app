import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listFacilitiesWithoutPhotos() {
    console.log('🔍 사진 없는 시설 조회 중...\n');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, address, image_url, gallery_images')
        .order('type')
        .order('name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    // 사진이 없는 시설 필터링 (image_url 없거나 gallery_images 비어있음)
    const noPhotos = facilities.filter(f => {
        const hasImageUrl = f.image_url && f.image_url.trim() !== '';
        const hasGallery = f.gallery_images && Array.isArray(f.gallery_images) && f.gallery_images.length > 0;
        return !hasImageUrl && !hasGallery;
    });

    // 사진이 있는 시설
    const hasPhotos = facilities.filter(f => {
        const hasImageUrl = f.image_url && f.image_url.trim() !== '';
        const hasGallery = f.gallery_images && Array.isArray(f.gallery_images) && f.gallery_images.length > 0;
        return hasImageUrl || hasGallery;
    });

    // 타입별로 그룹화
    const byType: Record<string, typeof noPhotos> = {};
    for (const f of noPhotos) {
        const type = f.type || 'unknown';
        if (!byType[type]) byType[type] = [];
        byType[type].push(f);
    }

    // 통계 출력
    console.log('📊 통계');
    console.log('='.repeat(50));
    console.log(`전체 시설: ${facilities.length}개`);
    console.log(`사진 있음: ${hasPhotos.length}개`);
    console.log(`사진 없음: ${noPhotos.length}개`);
    console.log('');

    // 타입별 현황
    console.log('📁 타입별 사진 없는 시설 수');
    console.log('-'.repeat(50));
    for (const [type, list] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
        console.log(`  ${type}: ${list.length}개`);
    }
    console.log('');

    // 상세 리스트
    console.log('📋 사진 없는 시설 상세 리스트');
    console.log('='.repeat(50));

    let report = '# 사진 없는 시설 리스트\n\n';
    report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 통계\n`;
    report += `- 전체 시설: ${facilities.length}개\n`;
    report += `- 사진 있음: ${hasPhotos.length}개\n`;
    report += `- 사진 없음: ${noPhotos.length}개\n\n`;

    for (const [type, list] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
        console.log(`\n## ${type} (${list.length}개)`);
        report += `## ${type} (${list.length}개)\n\n`;
        report += `| 이름 | 주소 |\n`;
        report += `|------|------|\n`;

        for (const f of list) {
            console.log(`  - ${f.name}`);
            const address = f.address?.substring(0, 30) || '-';
            report += `| ${f.name} | ${address} |\n`;
        }
        report += '\n';
    }

    // 리포트 저장
    fs.writeFileSync('scripts/no-photos-report.md', report);
    console.log('\n✅ 리포트 저장됨: scripts/no-photos-report.md');
}

listFacilitiesWithoutPhotos();
