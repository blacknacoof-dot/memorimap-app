/**
 * Google Places API (New) 테스트 스크립트
 * 시설 정보 수집: 전화번호, 웹사이트, 지도URL, 평점, 리뷰수, 영업시간, 좌표, 사진
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

if (!GOOGLE_API_KEY) {
    console.error('❌ VITE_GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
}

console.log('🔑 API Key 확인됨:', GOOGLE_API_KEY.substring(0, 10) + '...');

interface PlaceResult {
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

// 1. Text Search로 장소 검색 (Places API New)
async function searchPlace(query: string): Promise<string | null> {
    const url = 'https://places.googleapis.com/v1/places:searchText';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
        },
        body: JSON.stringify({
            textQuery: query,
            languageCode: 'ko'
        })
    });

    const data = await response.json();

    if (data.places && data.places.length > 0) {
        console.log(`✅ 검색 결과: ${data.places[0].displayName?.text}`);
        return data.places[0].id;
    }

    console.error('❌ 검색 결과 없음:', data);
    return null;
}

// 2. Place Details 가져오기
async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;

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

    if (data.error) {
        console.error('❌ Place Details 에러:', data.error);
        return null;
    }

    // 사진 URL 생성 (최대 5장)
    const photos: string[] = [];
    if (data.photos && data.photos.length > 0) {
        const photoNames = data.photos.slice(0, 5);
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
}

// 메인 실행
async function main() {
    // 방법 1: 좌표로 Nearby Search
    const lat = 36.2323557234889;
    const lng = 127.300560924394;

    console.log(`\n🔍 좌표 (${lat}, ${lng}) 근처 검색 중...\n`);

    // Nearby Search로 검색
    const nearbyUrl = 'https://places.googleapis.com/v1/places:searchNearby';

    const nearbyResponse = await fetch(nearbyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types'
        },
        body: JSON.stringify({
            locationRestriction: {
                circle: {
                    center: { latitude: lat, longitude: lng },
                    radius: 500.0  // 500m 반경
                }
            },
            includedTypes: ['cemetery', 'funeral_home', 'place_of_worship'],
            languageCode: 'ko',
            maxResultCount: 5
        })
    });

    const nearbyData = await nearbyResponse.json();

    console.log('📍 Nearby Search 결과:');
    if (nearbyData.places && nearbyData.places.length > 0) {
        nearbyData.places.forEach((p: any, i: number) => {
            console.log(`   [${i + 1}] ${p.displayName?.text} - ${p.formattedAddress}`);
            console.log(`       Types: ${p.types?.join(', ')}`);
        });

        // 첫 번째 결과로 상세 정보 가져오기
        const placeId = nearbyData.places[0].id;
        console.log(`\n📍 Place ID: ${placeId}\n`);

        const details = await getPlaceDetails(placeId);

        if (details) {
            console.log('═══════════════════════════════════════════');
            console.log('📋 수집된 정보');
            console.log('═══════════════════════════════════════════');
            console.log(`📌 시설명: ${details.name}`);
            console.log(`📍 주소: ${details.formattedAddress}`);
            console.log(`📞 전화번호: ${details.phone || '정보 없음'}`);
            console.log(`🌐 웹사이트: ${details.website || '정보 없음'}`);
            console.log(`🗺️ Google Maps: ${details.googleMapsUri || '정보 없음'}`);
            console.log(`⭐ 평점: ${details.rating || '정보 없음'} (${details.userRatingCount || 0}개 리뷰)`);
            console.log(`🧭 GPS 좌표: ${details.location ? `${details.location.lat}, ${details.location.lng}` : '정보 없음'}`);

            if (details.openingHours) {
                console.log(`\n🕐 영업시간:`);
                details.openingHours.forEach(h => console.log(`   ${h}`));
            }

            if (details.photos.length > 0) {
                console.log(`\n📸 사진 URL (${details.photos.length}장):`);
                details.photos.forEach((url, i) => console.log(`   [${i + 1}] ${url.substring(0, 80)}...`));
            }

            console.log('═══════════════════════════════════════════\n');

            const outputPath = path.resolve(process.cwd(), 'scripts', 'google_places_test_result.json');
            fs.writeFileSync(outputPath, JSON.stringify(details, null, 2), 'utf-8');
            console.log(`✅ 결과 저장됨: ${outputPath}`);
        }
    } else {
        console.log('❌ 주변 검색 결과 없음:', nearbyData);
    }
}

main().catch(console.error);
```
