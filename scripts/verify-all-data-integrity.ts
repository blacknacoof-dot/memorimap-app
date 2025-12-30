
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const kakaoApiKey = process.env.VITE_KAKAO_REST_API_KEY!;

if (!supabaseUrl || !supabaseKey || !kakaoApiKey) {
    console.error('❌ Environment variables missing (Supabase or Kakao Key)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Facility {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
    phone?: string;
}

interface VerificationResult {
    id: string;
    name: string;
    db_address: string;
    db_coords: { lat: number, lng: number };
    api_coords: { lat: number, lng: number } | null;
    api_address: string | null;
    distance_m: number | null;
    status: 'MATCH' | 'MISMATCH_COORDS' | 'NOT_FOUND_IN_API' | 'NO_DB_COORDS' | 'INVALID_ADDRESS';
    note?: string;
}

// Haversine formula to calculate distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

async function searchKakaoPlace(query: string, address?: string): Promise<any | null> {
    try {
        // Try precise search first: "Address" + "Name" or just "Address" if name is complex
        // Usually searching by Address is most accurate for coordinate verification
        let searchQuery = address || query;

        // If we have both, prefer address search for coordinates
        const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}&size=3`,
            { headers: { Authorization: `KakaoAK ${kakaoApiKey}` } }
        );

        if (!response.ok) return null;
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
            // If checking by address, pick the first one
            // If searching by name, try to match address
            if (address) {
                // Find best match for name if possible, otherwise first
                return data.documents[0];
            }
            return data.documents[0];
        }

        // Fallback: search by name only if address search failed or wasn't used
        if (address && query !== address) {
            const nameResp = await fetch(
                `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=3`,
                { headers: { Authorization: `KakaoAK ${kakaoApiKey}` } }
            );
            if (nameResp.ok) {
                const nameData = await nameResp.json();
                if (nameData.documents && nameData.documents.length > 0) return nameData.documents[0];
            }
        }

        return null;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

async function verifyAllData() {
    console.log('🔍 전체 시설 데이터 무결성 및 좌표 정합성 검증 시작...');

    // 1. Fetch All Data
    let allFacilities: Facility[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, lat, lng, type, phone')
            .range(from, from + batchSize - 1);

        if (error) {
            console.error('DB Fetch Error:', error);
            return;
        }

        if (!data || data.length === 0) break;
        allFacilities.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    console.log(`📋 검증 대상: 총 ${allFacilities.length}개 시설\n`);

    const results: VerificationResult[] = [];
    let processed = 0;

    // Parallel processing with rate limiting (approx 10 req/sec max? be safe with 5-10 concurrent)
    const CHUNK_SIZE = 5;

    for (let i = 0; i < allFacilities.length; i += CHUNK_SIZE) {
        const chunk = allFacilities.slice(i, i + CHUNK_SIZE);

        await Promise.all(chunk.map(async (fac) => {
            let status: VerificationResult['status'] = 'MATCH';
            let apiCoords = null;
            let apiAddress = null;
            let dist = null;
            let note = '';

            // Check if DB coords exist
            if (!fac.lat || !fac.lng || (fac.lat === 0 && fac.lng === 0)) {
                status = 'NO_DB_COORDS';
            }

            // Check if address exists
            if (!fac.address || fac.address.length < 2) {
                status = 'INVALID_ADDRESS';
            }

            // Call API if address is valid
            if (status !== 'INVALID_ADDRESS') {
                // Search mainly by address to verify location based on text address
                const cleanAddress = fac.address.split('(')[0].trim(); // Remove detail parts like (room 101)
                const apiResult = await searchKakaoPlace(fac.name, cleanAddress);

                if (apiResult) {
                    apiCoords = { lat: parseFloat(apiResult.y), lng: parseFloat(apiResult.x) };
                    apiAddress = apiResult.road_address_name || apiResult.address_name;

                    if (status !== 'NO_DB_COORDS') {
                        dist = calculateDistance(fac.lat, fac.lng, apiCoords.lat, apiCoords.lng);

                        // Threshold 500m
                        if (dist > 500) {
                            status = 'MISMATCH_COORDS';
                            note = `거리 차이: ${Math.round(dist)}m`;
                        }
                    } else {
                        // DB has no coords, but API found them -> Potential fix available
                        note = 'API 좌표 발견 (DB 업데이트 권장)';
                    }
                } else {
                    status = 'NOT_FOUND_IN_API';
                }
            }

            results.push({
                id: fac.id,
                name: fac.name,
                db_address: fac.address,
                db_coords: { lat: fac.lat, lng: fac.lng },
                api_coords: apiCoords,
                api_address: apiAddress,
                distance_m: dist,
                status,
                note
            });
        }));

        processed += chunk.length;
        if (processed % 50 === 0) process.stdout.write(`\r✅ 진행률: ${processed}/${allFacilities.length} 완료...`);

        // Rate limit pause
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n\n✅ 검증 완료. 리포트 생성 중...');

    // Generate Report
    const mismatched = results.filter(r => r.status === 'MISMATCH_COORDS').sort((a, b) => (b.distance_m || 0) - (a.distance_m || 0));
    const notFound = results.filter(r => r.status === 'NOT_FOUND_IN_API');
    const noCoords = results.filter(r => r.status === 'NO_DB_COORDS');
    const matched = results.filter(r => r.status === 'MATCH');

    let reportMd = `# 시설 데이터 무결성 검증 리포트\n`;
    reportMd += `검증 일시: ${new Date().toLocaleString()}\n`;
    reportMd += `전체 시설 수: ${allFacilities.length}개\n\n`;

    reportMd += `## 📊 요약\n`;
    reportMd += `- ✅ 정상 (일치): ${matched.length}개\n`;
    reportMd += `- ❌ 좌표 불일치 (>500m): ${mismatched.length}개\n`;
    reportMd += `- ⚠️ DB 좌표 누락: ${noCoords.length}개\n`;
    reportMd += `- ❓ API 미발견: ${notFound.length}개\n\n`;

    reportMd += `## ❌ 좌표 불일치 목록 (Top 100)\n`;
    reportMd += `| 시설명 | DB 주소 | DB 좌표 | API 좌표 | 거리 차이 | 비고 |\n`;
    reportMd += `|---|---|---|---|---|---|\n`;
    mismatched.slice(0, 100).forEach(r => {
        reportMd += `| ${r.name} | ${r.db_address} | ${r.db_coords.lat.toFixed(5)},${r.db_coords.lng.toFixed(5)} | ${r.api_coords?.lat.toFixed(5)},${r.api_coords?.lng.toFixed(5)} | ${Math.round(r.distance_m || 0)}m | ${r.note} |\n`;
    });

    reportMd += `\n## ⚠️ DB 좌표 누락 목록 (API 발견됨)\n`;
    reportMd += `| 시설명 | DB 주소 | API 발견 주소 | 비고 |\n`;
    reportMd += `|---|---|---|---|\n`;
    noCoords.filter(r => r.api_coords).slice(0, 50).forEach(r => {
        reportMd += `| ${r.name} | ${r.db_address} | ${r.api_address} | 업데이트 권장 |\n`;
    });

    fs.writeFileSync('verification_report.md', reportMd);
    console.log('📄 리포트 저장 완료: verification_report.md');

    // Save full JSON result for deeper analysis
    fs.writeFileSync('verification_full_result.json', JSON.stringify(results, null, 2));
}

verifyAllData().catch(console.error);
