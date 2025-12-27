import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { stringSimilarity } from 'string-similarity-js';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

if (!GOOGLE_API_KEY) {
    console.error('❌ VITE_GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

interface GooglePlaceData {
    name: string;
    formattedAddress: string;
    phone: string | null;
    website: string | null;
    googleMapsUri: string | null;
    rating: number | null;
    userRatingCount: number | null;
    openingHours: string[] | null;
    location: { lat: number; lng: number } | null;
    photos: string[];
}

interface EnrichmentCandidate {
    db_id: string;
    original_name: string;
    original_address: string;
    google_data: GooglePlaceData;
    similarity_score: number;
    status: 'match' | 'review_needed' | 'mismatch';
    notes?: string[];
}

// 문자열 유사도 검사
function calculateSimilarity(s1: string, s2: string): number {
    return stringSimilarity(s1, s2);
}

// 영문 주소 감지
function isEnglishAddress(address: string): boolean {
    // "South Korea" 나 영문 패턴이 많으면 영문 주소로 간주
    return /South Korea|KR|Gyeonggi-do|Seoul|Busan/i.test(address);
}

// 전화번호 정제
function cleanPhoneNumber(phone: string | null): string | null {
    if (!phone) return null;
    // "ext." 제거 및 공백 정리
    let cleaned = phone.split('ext.')[0].trim();
    return cleaned;
}

// 딜레이 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function searchPlace(query: string): Promise<string | null> {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
            },
            body: JSON.stringify({ textQuery: query, languageCode: 'ko' })
        });
        const data = await response.json();
        return data.places && data.places.length > 0 ? data.places[0].id : null;
    } catch (e) {
        console.error('Search API Error:', e);
        return null;
    }
}

async function getPlaceDetails(placeId: string): Promise<GooglePlaceData | null> {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': [
                    'displayName',
                    'formattedAddress',
                    'nationalPhoneNumber',
                    'internationalPhoneNumber',
                    'websiteUri',
                    'googleMapsUri',
                    'rating',
                    'userRatingCount',
                    'regularOpeningHours',
                    'location',
                    'photos'
                ].join(',')
            }
        });

        const data = await response.json();
        if (data.error) return null;

        const photos: string[] = [];
        if (data.photos && data.photos.length > 0) {
            // 최대 3장만 수집
            const photoNames = data.photos.slice(0, 3);
            for (const photo of photoNames) {
                const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=800&key=${GOOGLE_API_KEY}`;
                photos.push(photoUrl);
            }
        }

        return {
            name: data.displayName?.text || '',
            formattedAddress: data.formattedAddress || '',
            phone: data.nationalPhoneNumber || data.internationalPhoneNumber || null,
            website: data.websiteUri || null,
            googleMapsUri: data.googleMapsUri || null,
            rating: data.rating || null,
            userRatingCount: data.userRatingCount || null,
            openingHours: data.regularOpeningHours?.weekdayDescriptions || null,
            location: data.location || null,
            photos: photos
        };
    } catch (e) {
        console.error('Details API Error:', e);
        return null;
    }
}

async function main() {
    console.log('🚀 (Refined) 가격 정보 없는 시설 데이터 보강 시작...');

    // 1. 대상 시설 추출
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .or('price_range.is.null,prices.is.null');

    if (error || !facilities) {
        console.error('❌ 시설 목록 로드 실패:', error);
        return;
    }

    console.log(`📋 대상 시설 수: ${facilities.length}개`);

    let apiCalls = { search: 0, details: 0, photos: 0 };
    const candidates: EnrichmentCandidate[] = [];
    const notFound: any[] = [];

    // 전체 대상 실행
    const targetFacilities = facilities;

    for (let i = 0; i < targetFacilities.length; i++) {
        const facility = targetFacilities[i];
        console.log(`\n[${i + 1}/${targetFacilities.length}] 처리 중: ${facility.name}`);

        let queryAddress = facility.address || '';
        const addressParts = queryAddress.split(' ');
        if (addressParts.length > 2) {
            queryAddress = `${addressParts[0]} ${addressParts[1]}`;
        }

        const searchQuery = `${facility.name} ${queryAddress}`.trim();

        // 1. 검색
        const placeId = await searchPlace(searchQuery);
        apiCalls.search++;

        if (placeId) {
            // 2. 상세 정보
            const details = await getPlaceDetails(placeId);
            apiCalls.details++;
            if (details) apiCalls.photos += details.photos.length;

            if (details) {
                const similarity = calculateSimilarity(facility.name, details.name);
                let status: 'match' | 'review_needed' | 'mismatch' = 'match';
                const notes: string[] = [];

                if (similarity < 0.5) status = 'mismatch';
                else if (similarity < 0.8) status = 'review_needed';

                // **중요: 주소 검증 로직**
                // 구글 주소가 영문이면, 기존 주소를 유지하도록 설정 (formattedAddress 덮어쓰기 방지용)
                if (isEnglishAddress(details.formattedAddress)) {
                    notes.push('English Address Detected (Will Keep Original)');
                    // details.formattedAddress = facility.address; // 여기서 바꾸지 않고, 적용 스크립트에서 결정하거나 여기서 플래그만 줌
                }

                // **중요: 전화번호 정제**
                const cleanedPhone = cleanPhoneNumber(details.phone);
                if (cleanedPhone !== details.phone) {
                    notes.push(`Phone Cleaned: ${details.phone} -> ${cleanedPhone}`);
                    details.phone = cleanedPhone;
                }

                console.log(`   ✅ 찾음: ${details.name} (유사도: ${similarity.toFixed(2)}) -> ${status}`);
                if (notes.length > 0) console.log(`      📝 특이사항: ${notes.join(', ')}`);

                candidates.push({
                    db_id: facility.id,
                    original_name: facility.name,
                    original_address: facility.address,
                    google_data: details,
                    similarity_score: similarity,
                    status: status,
                    notes: notes
                });
            } else {
                console.log(`   ⚠️ 상세 정보 가져오기 실패`);
            }
        } else {
            console.log(`   ❌ 구글 검색 실패`);
            notFound.push({
                name: facility.name,
                address: facility.address,
                phone: facility.phone
            });
        }

        await delay(200);
    }

    // 결과 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.resolve(process.cwd(), 'scripts', `google_enrichment_candidates_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(candidates, null, 2), 'utf-8');

    const csvPath = path.resolve(process.cwd(), 'scripts', `google_not_found_${timestamp}.csv`);
    const csvContent = "이름,주소,전화번호\n" + notFound.map(f => `${f.name},${f.address},${f.phone}`).join('\n');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    console.log('\n═══════════════════════════════════════════');
    console.log('📊 처리 결과 요약');
    console.log(`총 대상: ${targetFacilities.length}개`);
    console.log(`✅ 구글 매칭 성공 (후보군): ${candidates.length}개`);
    console.log(`❌ 구글 매칭 실패: ${notFound.length}개`);
    console.log(`💰 API 호출 추정: Search(${apiCalls.search}), Details(${apiCalls.details}), Photos(${apiCalls.photos * 5})`); // Note: cost logic approximate
    console.log(`📂 후보군 파일: ${jsonPath}`);
    console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
