/**
 * 시설 현황 CSV 리포트 생성 스크립트 (최종)
 * - 전체 시설 조회 (약 2,219개)
 * - 정보 보유 현황 (주소, 전화, 사진, 가격) 확인
 * - 좌표 중복/인접 시설 확인
 * - 네이버/구글 지도 검색 링크 (일반 URL) 추가
 * - UTF-8 with BOM CSV 생성
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Facility {
    id: number;
    name: string;
    type: string;
    address: string | null;
    phone: string | null;
    lat: number | null;
    lng: number | null;
    image_url: string | null;
    gallery_images: string[] | null;
    prices: any[] | null;
    price_info: any[] | null;
}

// 거리 계산 함수 (Haversine formula, 미터 단위)
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // 지구 반경 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

async function generateReport() {
    console.log('📊 시설 현황 리포트 생성 시작 (Final - v2 Rollback)...\n');

    // 1. 전체 시설 조회 (페이지네이션으로 모든 데이터 가져오기)
    let allFacilities: Facility[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
        const { data: facilities, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .range(from, from + step - 1)
            .order('id');

        if (error) {
            console.error('DB Error:', error);
            return;
        }

        if (!facilities || facilities.length === 0) break;

        allFacilities = allFacilities.concat(facilities);
        console.log(`조회 중... 누적 ${allFacilities.length}개`);

        if (facilities.length < step) break;
        from += step;
    }

    const facilities = allFacilities;
    console.log(`\n총 ${facilities.length}개 시설 조회됨.\n`);

    // 2. 데이터 처리
    const reportData = facilities.map((f: Facility, index: number, all: Facility[]) => {
        // 타입 한글 이름
        const typeMap: Record<string, string> = {
            'funeral': '장례식장',
            'charnel': '봉안당',
            'park': '추모공원',
            'complex': '복합시설',
            'pet': '동물장례'
        };
        const typeName = typeMap[f.type] || f.type;

        // 사진 유무
        const hasPhoto = (f.image_url && f.image_url.trim() !== '') ||
            (f.gallery_images && f.gallery_images.length > 0);

        // 가격 유무
        const hasPrice = (f.prices && f.prices.length > 0) ||
            (f.price_info && f.price_info.length > 0);

        // 좌표 중복 확인 (10m 이내)
        let duplicateCoord = 'X';
        let nearbyFacility = '';

        if (f.lat && f.lng) {
            const nearby = all.find(other =>
                other.id !== f.id &&
                other.lat && other.lng &&
                getDistance(f.lat!, f.lng!, other.lat, other.lng) < 10
            );

            if (nearby) {
                duplicateCoord = 'O';
                nearbyFacility = `${nearby.name} (${nearby.id})`;
            }
        }

        // 상태 (정보 충실도)
        let status = '양호';
        const missing = [];
        if (!f.address) missing.push('주소');
        if (!f.phone) missing.push('전화');
        if (!hasPhoto) missing.push('사진');
        if (!hasPrice) missing.push('가격');

        if (missing.length > 0) {
            status = `미흡 (${missing.join(',')})`;
        }

        // 사진 링크 (기본 텍스트)
        const links: string[] = [];
        let count = 0;

        if (f.image_url && f.image_url.trim() !== '') {
            links.push(`[대표](${f.image_url})`);
            count++;
        }

        if (count < 2 && f.gallery_images && Array.isArray(f.gallery_images)) {
            for (let i = 0; i < f.gallery_images.length; i++) {
                if (count >= 2) break;
                const url = f.gallery_images[i];
                if (url && url.trim() !== '') {
                    links.push(`[추가](${url})`);
                    count++;
                }
            }
        }

        const photoLinks = links.join(', ');

        // 지도 링크 URL 생성
        const queryName = f.name;
        const queryAddress = f.address ? ` ${f.address}` : '';
        const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(queryName)}`;
        const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryName + queryAddress)}`;

        return {
            id: f.id,
            type: typeName,
            name: f.name.replace(/,/g, ' '),
            address: (f.address || '').replace(/,/g, ' '),
            phone: f.phone || '',
            hasPhoto: hasPhoto ? 'O' : 'X',
            hasPrice: hasPrice ? 'O' : 'X',
            duplicateCoord,
            nearbyFacility: nearbyFacility.replace(/,/g, ' '),
            status,
            photoLinks,
            naverUrl,
            googleUrl
        };
    });

    // 3. CSV 생성 (BOM 추가)
    // 롤백: 단순 URL 사용
    const header = 'ID,구분,시설명,주소,전화번호,사진유무,가격유무,좌표중복,인접시설,상태,사진링크,네이버지도(링크),구글지도(링크)\n';

    const rows = reportData.map(d =>
        `${d.id},${d.type},${d.name},${d.address},${d.phone},${d.hasPhoto},${d.hasPrice},${d.duplicateCoord},${d.nearbyFacility},${d.status},"${d.photoLinks}",${d.naverUrl},${d.googleUrl}`
    ).join('\n');

    const csvContent = '\uFEFF' + header + rows;

    // 최종 버전 (좌표 업데이트 완료)
    const outputPath = 'facility_status_final_updated.csv';
    fs.writeFileSync(outputPath, csvContent);

    // 4. 통계 출력
    const stats = {
        total: facilities.length,
        noPhoto: reportData.filter(d => d.hasPhoto === 'X').length,
    };

    console.log('📈 통계 요약 (최종)');
    console.log('='.repeat(30));
    console.log(`전체 시설: ${stats.total.toLocaleString()}개`);
    console.log(`사진 없음: ${stats.noPhoto.toLocaleString()}개`);
    console.log('='.repeat(30));
    console.log(`\n✅ 리포트 생성 완료: ${outputPath}`);
}

generateReport().catch(console.error);
