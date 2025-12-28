import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const kakaoApiKey = process.env.VITE_KAKAO_REST_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface KakaoPlace {
    id: string;
    place_name: string;
    category_name: string;
    address_name: string;
    road_address_name: string;
    phone: string;
    place_url: string;
    x: string;
    y: string;
}

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
    status: 'matched' | 'partial' | 'not_found';
}

async function searchKakaoPlace(query: string, address?: string): Promise<KakaoPlace | null> {
    try {
        // 시설명 + 지역으로 검색
        const searchQuery = address ? `${query} ${address.split(' ')[0]}` : query;

        const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}&size=5`,
            {
                headers: {
                    Authorization: `KakaoAK ${kakaoApiKey}`
                }
            }
        );

        if (!response.ok) {
            console.error(`API Error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
            // 장례/추모/봉안 관련 카테고리 우선
            const relevant = data.documents.find((d: KakaoPlace) =>
                d.category_name?.includes('장례') ||
                d.category_name?.includes('추모') ||
                d.category_name?.includes('봉안') ||
                d.category_name?.includes('납골') ||
                d.category_name?.includes('병원') ||
                d.place_name.includes(query.substring(0, 4))
            );
            return relevant || data.documents[0];
        }
        return null;
    } catch (error) {
        console.error('Search error:', error);
        return null;
    }
}

function calculateMatchScore(dbName: string, dbAddress: string, kakao: KakaoPlace): number {
    let score = 0;

    // 이름 유사도 체크
    const dbNameClean = dbName.replace(/[^\w가-힣]/g, '');
    const kakaoNameClean = kakao.place_name.replace(/[^\w가-힣]/g, '');

    if (dbNameClean === kakaoNameClean) {
        score += 50;
    } else if (kakaoNameClean.includes(dbNameClean) || dbNameClean.includes(kakaoNameClean)) {
        score += 30;
    } else if (dbNameClean.substring(0, 4) === kakaoNameClean.substring(0, 4)) {
        score += 20;
    }

    // 주소 유사도 체크
    const dbAddrParts = dbAddress.split(' ').slice(0, 3).join(' ');
    const kakaoAddr = kakao.road_address_name || kakao.address_name;

    if (kakaoAddr && kakaoAddr.includes(dbAddrParts)) {
        score += 50;
    } else if (kakaoAddr && dbAddrParts.split(' ').some(part => kakaoAddr.includes(part))) {
        score += 25;
    }

    return score;
}

async function collectData() {
    console.log('🔍 카카오 API로 시설 데이터 수집 시작...\n');

    // 사진 없는 시설 조회
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type, address, phone, image_url, gallery_images')
        .order('type')
        .order('name');

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    // 사진 없는 시설만 필터링
    const noPhotos = facilities.filter(f => {
        const hasImageUrl = f.image_url && f.image_url.trim() !== '';
        const hasGallery = f.gallery_images && Array.isArray(f.gallery_images) && f.gallery_images.length > 0;
        return !hasImageUrl && !hasGallery;
    });

    console.log(`총 ${noPhotos.length}개 시설 처리 예정\n`);

    const collectedData: CollectedData[] = [];
    let processed = 0;
    let matched = 0;
    let partial = 0;
    let notFound = 0;

    for (const facility of noPhotos) {
        processed++;

        // 진행률 표시
        if (processed % 10 === 0) {
            console.log(`진행: ${processed}/${noPhotos.length} (${Math.round(processed / noPhotos.length * 100)}%)`);
        }

        const kakaoResult = await searchKakaoPlace(facility.name, facility.address);

        if (kakaoResult) {
            const score = calculateMatchScore(facility.name, facility.address || '', kakaoResult);

            const data: CollectedData = {
                facility_id: facility.id,
                facility_name: facility.name,
                db_address: facility.address || '',
                db_phone: facility.phone,
                kakao_name: kakaoResult.place_name,
                kakao_address: kakaoResult.road_address_name || kakaoResult.address_name,
                kakao_phone: kakaoResult.phone || null,
                kakao_place_url: kakaoResult.place_url,
                match_score: score,
                status: score >= 70 ? 'matched' : score >= 40 ? 'partial' : 'not_found'
            };

            collectedData.push(data);

            if (data.status === 'matched') {
                matched++;
                console.log(`✅ [${processed}] ${facility.name} → ${kakaoResult.place_name} (점수: ${score})`);
            } else if (data.status === 'partial') {
                partial++;
                console.log(`⚠️ [${processed}] ${facility.name} → ${kakaoResult.place_name} (점수: ${score})`);
            } else {
                notFound++;
                console.log(`❌ [${processed}] ${facility.name} - 낮은 매칭 점수`);
            }
        } else {
            collectedData.push({
                facility_id: facility.id,
                facility_name: facility.name,
                db_address: facility.address || '',
                db_phone: facility.phone,
                kakao_name: null,
                kakao_address: null,
                kakao_phone: null,
                kakao_place_url: null,
                match_score: 0,
                status: 'not_found'
            });
            notFound++;
            console.log(`❌ [${processed}] ${facility.name} - 검색 결과 없음`);
        }

        // API 호출 제한 (100ms 간격)
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 결과 저장
    fs.writeFileSync('scripts/kakao-collected-data.json', JSON.stringify(collectedData, null, 2));

    // 리포트 생성
    let report = `# 카카오 API 데이터 수집 결과\n\n`;
    report += `생성일: ${new Date().toLocaleString('ko-KR')}\n\n`;
    report += `## 요약\n`;
    report += `- 처리 시설: ${processed}개\n`;
    report += `- 매칭 성공 (70+): ${matched}개\n`;
    report += `- 부분 매칭 (40-69): ${partial}개\n`;
    report += `- 미발견: ${notFound}개\n\n`;

    // 매칭된 시설 (전화번호/주소 업데이트 가능)
    const updateCandidates = collectedData.filter(d =>
        d.status === 'matched' &&
        (d.kakao_phone && !d.db_phone)
    );

    report += `## 전화번호 업데이트 가능 (${updateCandidates.length}개)\n\n`;
    report += `| 시설명 | DB주소 | 카카오주소 | 카카오전화 |\n`;
    report += `|--------|--------|------------|------------|\n`;

    for (const d of updateCandidates.slice(0, 50)) {
        report += `| ${d.facility_name} | ${d.db_address?.substring(0, 20)}... | ${d.kakao_address?.substring(0, 20)}... | ${d.kakao_phone} |\n`;
    }

    fs.writeFileSync('scripts/kakao-collection-report.md', report);

    console.log('\n' + '='.repeat(50));
    console.log('📊 수집 완료!');
    console.log(`   매칭 성공: ${matched}개`);
    console.log(`   부분 매칭: ${partial}개`);
    console.log(`   미발견: ${notFound}개`);
    console.log('\n📁 저장된 파일:');
    console.log('   - scripts/kakao-collected-data.json');
    console.log('   - scripts/kakao-collection-report.md');
}

collectData();
