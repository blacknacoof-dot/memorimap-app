import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase 설정
const supabaseUrl = 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Facility {
    id: string;
    name: string;
    type: string;
    address: string;
    lat: number;
    lng: number;
    phone: string;
    description: string;
    image_url: string;
    gallery_images: string[];
    source: string;
    created_at: string;
}

async function checkDaejeonFacilities() {
    console.log('=== 대전 장례식장 데이터 분석 ===\n');

    // 1. Supabase에서 대전 관련 모든 시설 조회 (type 상관없이)
    console.log('--- 1. DB 조회 시작 ---\n');

    const { data: allDaejeonFacilities, error: error1 } = await supabase
        .from('memorial_spaces')
        .select('*')
        .or('address.ilike.%대전%,address.ilike.%대전광역시%');

    if (error1) {
        console.error('데이터 조회 오류:', error1.message);
    } else {
        console.log(`📍 대전 관련 전체 시설: ${allDaejeonFacilities?.length || 0}개\n`);
    }

    // 타입별 분류
    const typeCount: Record<string, number> = {};
    for (const f of (allDaejeonFacilities || [])) {
        typeCount[f.type] = (typeCount[f.type] || 0) + 1;
    }
    console.log('타입별 분포:');
    for (const [type, count] of Object.entries(typeCount)) {
        console.log(`  - ${type}: ${count}개`);
    }

    // 장례식장 타입만 필터
    const funeralHomes = (allDaejeonFacilities || []).filter(f =>
        f.type === 'funeral_home' ||
        f.type === 'funeral' ||
        f.name?.includes('장례')
    );

    console.log(`\n🏥 장례식장(funeral_home/funeral 타입 또는 이름에 '장례' 포함): ${funeralHomes.length}개\n`);

    // 2. CSV 파일 읽기
    console.log('--- 2. 공공데이터 CSV 분석 ---\n');

    const csvPath = join(__dirname, '..', '장례식장', '15774129-2025-12-23 대전.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.split('\n').filter(line => line.trim());

    // 헤더 제외하고 파싱
    const csvFacilities: { name: string; address: string; tel: string; hasImage: boolean; imageUrl: string }[] = [];
    for (let i = 1; i < csvLines.length; i++) {
        const line = csvLines[i];
        if (!line.trim()) continue;

        // CSV 파싱 (쉼표 구분, 따옴표 처리)
        const parts = line.split(',').reduce((acc: string[], curr: string) => {
            if (acc.length > 0 && acc[acc.length - 1].startsWith('"') && !acc[acc.length - 1].endsWith('"')) {
                acc[acc.length - 1] += ',' + curr;
            } else {
                acc.push(curr);
            }
            return acc;
        }, []);

        const imageUrl = parts[0]?.replace(/"/g, '') || '';
        const name = parts[1]?.replace(/"/g, '') || '';
        const address = parts[2]?.replace(/"/g, '') || '';
        const tel = parts[4]?.replace(/"/g, '') || '';

        if (name) {
            csvFacilities.push({
                name,
                address,
                tel,
                hasImage: imageUrl.startsWith('http'),
                imageUrl
            });
        }
    }

    // 중복 제거 (같은 이름 기준)
    const uniqueCsvFacilities = csvFacilities.filter((f, i, arr) =>
        arr.findIndex(x => x.name === f.name) === i
    );

    console.log(`📄 공공데이터 CSV에서 대전 장례식장 ${uniqueCsvFacilities.length}개 발견 (중복 제거 후)\n`);

    // 3. 비교 분석
    console.log('--- 3. 매칭 분석 ---\n');

    const matched: { csvName: string; dbName: string; dbFac: Facility }[] = [];
    const notInDb: { name: string; address: string; tel: string; hasImage: boolean }[] = [];

    for (const csvFac of uniqueCsvFacilities) {
        const normalizedCsvName = csvFac.name.replace(/\s/g, '').replace(/장례식장/g, '');

        const dbMatch = funeralHomes.find((f: Facility) => {
            const normalizedDbName = (f.name || '').replace(/\s/g, '').replace(/장례식장/g, '');
            return normalizedDbName.includes(normalizedCsvName) ||
                normalizedCsvName.includes(normalizedDbName) ||
                f.name === csvFac.name;
        });

        if (dbMatch) {
            matched.push({ csvName: csvFac.name, dbName: dbMatch.name, dbFac: dbMatch as Facility });
        } else {
            notInDb.push({ name: csvFac.name, address: csvFac.address, tel: csvFac.tel, hasImage: csvFac.hasImage });
        }
    }

    console.log(`✅ DB에 있음: ${matched.length}개`);
    console.log(`❌ DB에 없음: ${notInDb.length}개\n`);

    // 4. 매칭된 시설 상세 분석
    console.log('\n========================================');
    console.log('=== DB에 있는 대전 장례식장 상세 목록 ===');
    console.log('========================================\n');

    for (const m of matched) {
        const f = m.dbFac;
        const hasRealImage = f.image_url && f.image_url !== '' && !f.image_url.includes('unsplash');
        const hasGallery = f.gallery_images && f.gallery_images.length > 0;

        console.log(`📍 ${f.name}`);
        console.log(`   (CSV: ${m.csvName})`);
        console.log(`   주소: ${f.address}`);
        console.log(`   전화: ${f.phone || '없음'}`);
        console.log(`   좌표: ${f.lat && f.lng ? `✅ (${f.lat.toFixed(4)}, ${f.lng.toFixed(4)})` : '❌ 없음'}`);
        console.log(`   대표이미지: ${hasRealImage ? '✅ 있음' : (f.image_url?.includes('unsplash') ? '⚠️ 기본이미지' : '❌ 없음')}`);
        console.log(`   갤러리이미지: ${hasGallery ? `✅ ${f.gallery_images.length}개` : '❌ 없음'}`);
        console.log(`   소개: ${f.description ? '✅ 있음' : '❌ 없음'}`);
        console.log(`   출처: ${f.source || 'unknown'}`);
        console.log('');
    }

    // 5. DB에 없는 시설 목록
    if (notInDb.length > 0) {
        console.log('\n========================================');
        console.log('=== 공공데이터에만 있음 (DB 미등록) ===');
        console.log('========================================\n');

        for (const f of notInDb) {
            console.log(`❌ ${f.name}`);
            console.log(`   주소: ${f.address}`);
            console.log(`   전화: ${f.tel}`);
            console.log(`   공공데이터 이미지: ${f.hasImage ? '✅ 있음' : '❌ 없음'}`);
            console.log('');
        }
    }

    // 6. 통계 요약
    const withRealImages = matched.filter(m => m.dbFac.image_url && !m.dbFac.image_url.includes('unsplash'));
    const withGallery = matched.filter(m => m.dbFac.gallery_images && m.dbFac.gallery_images.length > 0);
    const withDescription = matched.filter(m => m.dbFac.description && m.dbFac.description.trim() !== '');
    const withCoords = matched.filter(m => m.dbFac.lat && m.dbFac.lng && m.dbFac.lat !== 0 && m.dbFac.lng !== 0);

    console.log('\n========================================');
    console.log('=== 최종 요약 리포트 ===');
    console.log('========================================\n');

    console.log(`📊 데이터 현황:`);
    console.log(`   - 공공데이터(CSV): ${uniqueCsvFacilities.length}개 시설`);
    console.log(`   - DB 장례식장(대전): ${funeralHomes.length}개 시설`);
    console.log(`   - 매칭됨: ${matched.length}개`);
    console.log(`   - DB 미등록: ${notInDb.length}개`);
    console.log('');
    console.log(`🗺️ 지도 좌표:`);
    console.log(`   - 좌표 있음: ${withCoords.length}/${matched.length}개`);
    console.log(`   - 좌표 없음: ${matched.length - withCoords.length}/${matched.length}개`);
    console.log('');
    console.log(`📝 소개(설명):`);
    console.log(`   - 소개 있음: ${withDescription.length}/${matched.length}개`);
    console.log(`   - 소개 없음: ${matched.length - withDescription.length}/${matched.length}개`);
    console.log('');
    console.log(`🖼️ 이미지:`);
    console.log(`   - 실제 이미지: ${withRealImages.length}/${matched.length}개`);
    console.log(`   - 갤러리 있음: ${withGallery.length}/${matched.length}개`);
    console.log(`   - 이미지 없음/기본: ${matched.length - withRealImages.length}/${matched.length}개`);
}

checkDaejeonFacilities().catch(console.error);
