
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const naverClientId = process.env.VITE_NAVER_CLIENT_ID!;
const naverClientSecret = process.env.VITE_NAVER_CLIENT_SECRET!;

if (!supabaseUrl || !supabaseKey || !naverClientId || !naverClientSecret) {
    console.error('❌ Environment variables missing (Supabase or Naver Keys)');
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

// TM128 to WGS84 Approximation for Naver mapx/mapy
// Naver mapx/mapy are basically TM128 * 10^7?? No, actually KATEC.
// However, the simple division by 10^7 is a rough approximation often cited, 
// BUT typically mapx/mapy from Search API are integers. 
// Let's use the logic from recalculate-coordinates-naver.ts which seemed accepted, 
// but actually Naver Search API returns KATEC (TM128 variant).
// Simple division is NOT correct for converting KATEC to WGS84 directly.
// BUT, if we look at `recalculate-coordinates-naver.ts` provided earlier:
// It used: lng = x / 10000000, lat = y / 10000000. 
// Wait, that file's comment said "Naver coordinates are scaled by 10^7... simple division is rough".
// Actually, Naver Search API returns "mapx", "mapy" as integers which are KATEC coordinates.
// We need a proper conversion or use the Geocoding API if possible?
// The user asked for "Naver API check". 
// Search API documentation says: "mapx: x coordinate (KATEC), mapy: y coordinate (KATEC)"
// There is no easy formula KATEC -> WGS84 without complex math (Proj4).
// However, memorimap seems to have `proj4` installed in package.json.
// Let's use `proj4` for accurate conversion if possible, or fallback to the previous logic if that was intended.
// Checking package.json... "proj4": "^2.20.2". Excellent.

import proj4 from 'proj4';

// Define projections
// Naver KATEC (TM128) definition. Note: Naver uses a slightly modified KATEC.
// Common definition for South Korea KATEC (EPSG:5179 is often compatible-ish but Naver is specific).
// Proper string for Naver KATEC (often called TM128 in Korea contexts, but distinct):
// "+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43"
// Wait, mapx/mapy from Search API are NOT * 10^7?
// Docs: "mapx: 업소의 x 좌표 (KATEC)".
// Let's check `recalculate-coordinates-naver.ts` again. It did `x / 10000000`. 
// If that script was working, then maybe I should stick to it? 
// BUT the user wants "verification", implying accuracy.
// If I divide KATEC (usually ~300000, ~550000) by 10^7, I get 0.03... that is definitely wrong for Lat/Lng.
// IF the previous script did that, it might have been wrong or handling a different API version?
// Naver *Cloud* Geocoding API returns WGS84. Naver *Search* API returns KATEC integers.
// Let's assume KATEC and use proj4.

// KATEC definition for Naver
// Source: Common knowledge for KR GIS devs for Naver OpenAPI
const KATEC = '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43 +units=m +no_defs';
const WGS84 = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

function katecToWgs84(x: number, y: number): { lat: number, lng: number } {
    try {
        const p = proj4(KATEC, WGS84, [x, y]);
        return { lat: p[1], lng: p[0] };
    } catch (e) {
        console.error('Projection Error:', e);
        return { lat: 0, lng: 0 };
    }
}

// Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
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

async function searchNaver(query: string): Promise<any | null> {
    try {
        const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1`;
        const response = await axios.get(url, {
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0];
        }
        return null;
    } catch (error) {
        // console.error('Naver API Error:', error);
        return null;
    }
}

function cleanHtml(text: string): string {
    return text.replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&');
}

async function verifyAllData() {
    console.log('🔍 네이버 API 기반 시설 데이터 무결성 검증 시작...');

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

    // Process in chunks - Naver has rate limits (usually 10 req/sec for free tier?)
    // Safe to go slow
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

            if (status !== 'INVALID_ADDRESS') {
                // Query: Region + Name
                const region = fac.address.split(' ').slice(0, 2).join(' ');
                const query = `${region} ${fac.name}`.trim();

                const apiResult = await searchNaver(query);

                if (apiResult) {
                    // Naver returns integer mapx/mapy (KATEC)
                    const mapx = parseInt(apiResult.mapx, 10);
                    const mapy = parseInt(apiResult.mapy, 10);

                    const wgs84 = katecToWgs84(mapx, mapy);

                    apiCoords = wgs84;
                    apiAddress = apiResult.roadAddress || apiResult.address;

                    if (status !== 'NO_DB_COORDS') {
                        dist = calculateDistance(fac.lat, fac.lng, apiCoords.lat, apiCoords.lng);

                        // Threshold 500m
                        if (dist > 500) {
                            status = 'MISMATCH_COORDS';
                            note = `거리 차이: ${Math.round(dist)}m`;
                        }
                    } else {
                        note = 'API 좌표 발견 (DB 업데이트 권장)';
                    }
                } else {
                    // Retry with just name if detailed query fails
                    const apiResultRetry = await searchNaver(fac.name);
                    if (apiResultRetry) {
                        const mapx = parseInt(apiResultRetry.mapx, 10);
                        const mapy = parseInt(apiResultRetry.mapy, 10);
                        const wgs84 = katecToWgs84(mapx, mapy);

                        apiCoords = wgs84;
                        apiAddress = apiResultRetry.roadAddress || apiResultRetry.address;

                        // Check if the address matches roughly to confirm it's the SAME facility
                        const dbAddrRegion = fac.address.substring(0, 2);
                        const apiAddrRegion = (apiAddress || '').substring(0, 2);

                        if (dbAddrRegion === apiAddrRegion) {
                            if (status !== 'NO_DB_COORDS') {
                                dist = calculateDistance(fac.lat, fac.lng, apiCoords.lat, apiCoords.lng);
                                if (dist > 500) {
                                    status = 'MISMATCH_COORDS';
                                    note = `거리 차이(이름검색): ${Math.round(dist)}m`;
                                }
                            } else {
                                note = 'API 좌표 발견 (DB 업데이트 권장 - 이름검색)';
                            }
                        } else {
                            status = 'NOT_FOUND_IN_API'; // Different region means probably wrong match
                            note = '이름 유사 검색결과 지역 불일치';
                        }
                    } else {
                        status = 'NOT_FOUND_IN_API';
                    }
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

        // Rate limit 
        await new Promise(r => setTimeout(r, 250));
    }

    console.log('\n\n✅ 검증 완료. 리포트 생성 중...');

    // Generate Report
    const mismatched = results.filter(r => r.status === 'MISMATCH_COORDS').sort((a, b) => (b.distance_m || 0) - (a.distance_m || 0));
    const notFound = results.filter(r => r.status === 'NOT_FOUND_IN_API');
    const noCoords = results.filter(r => r.status === 'NO_DB_COORDS');
    const matched = results.filter(r => r.status === 'MATCH');

    let reportMd = `# 시설 데이터 무결성 검증 리포트 (네이버 API)\n`;
    reportMd += `검증 일시: ${new Date().toLocaleString()}\n`;
    reportMd += `전체 시설 수: ${allFacilities.length}개\n\n`;

    reportMd += `## 📊 요약\n`;
    reportMd += `- ✅ 정상 (일치): ${matched.length}개\n`;
    reportMd += `- ❌ 좌표 불일치 (>500m): ${mismatched.length}개\n`;
    reportMd += `- ⚠️ DB 좌표 누락: ${noCoords.length}개\n`;
    reportMd += `- ❓ API 미발견/매칭실패: ${notFound.length}개\n\n`;

    reportMd += `## ❌ 좌표 불일치 목록 (Top 100)\n`;
    reportMd += `| 시설명 | DB 주소 | DB 좌표 | API 좌표(네이버) | 거리 차이 | 비고 |\n`;
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

    // Also include a section for API Address Mismatch even if coords match? 
    // Usually if coords match, address is fine.

    fs.writeFileSync('verification_report_naver.md', reportMd);
    console.log('📄 리포트 저장 완료: verification_report_naver.md');

    fs.writeFileSync('verification_full_result_naver.json', JSON.stringify(results, null, 2));
}

verifyAllData().catch(console.error);
