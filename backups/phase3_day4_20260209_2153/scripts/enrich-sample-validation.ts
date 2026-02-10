import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { stringSimilarity } from 'string-similarity-js';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || '';
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

// Copied from main script
interface GooglePlaceData {
    name: string;
    formattedAddress: string;
    phone: string | null;
    photos: string[];
    // ... others irrelevant for this test
    rating: number | null;
    userRatingCount: number | null;
}

// 간단한 함수들
function isEnglishAddress(address: string): boolean {
    return /South Korea|KR|Gyeonggi-do|Seoul|Busan|Jeonnam|Gyeongbuk/i.test(address);
}

function cleanPhoneNumber(phone: string | null): string | null {
    if (!phone) return null;
    return phone.split('ext.')[0].trim();
}

async function searchPlace(query: string) {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_API_KEY, 'X-Goog-FieldMask': 'places.id' },
        body: JSON.stringify({ textQuery: query, languageCode: 'ko' })
    });
    const data = await response.json();
    return data.places?.[0]?.id;
}

async function getPlaceDetails(placeId: string) {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'displayName,formattedAddress,nationalPhoneNumber,photos,rating,userRatingCount'
        }
    });
    const data = await response.json();
    if (data.error) return null;

    const photos = (data.photos || []).slice(0, 3).map((p: any) =>
        `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=800&maxWidthPx=800&key=${GOOGLE_API_KEY}`
    );

    return {
        name: data.displayName?.text,
        formattedAddress: data.formattedAddress,
        phone: data.nationalPhoneNumber,
        photos: photos,
        rating: data.rating,
        userRatingCount: data.userRatingCount,
    };
}

async function main() {
    console.log('🚀 (Validation) 샘플 10개 + 중앙추모공원 데이터 생성 중...');

    // 1. 중앙추모공원 + 랜덤 10개
    const { data: central } = await supabase.from('memorial_spaces').select('*').eq('name', '중앙추모공원').single();
    const { data: others } = await supabase.from('memorial_spaces').select('*').or('price_range.is.null,prices.is.null').limit(10);

    const facilities = [central, ...(others || [])].filter(Boolean);
    const candidates = [];

    for (const facility of facilities) {
        console.log(`Processing: ${facility.name}`);
        let queryAddress = facility.address || '';
        const addressParts = queryAddress.split(' ');
        if (addressParts.length > 2) queryAddress = `${addressParts[0]} ${addressParts[1]}`;

        const placeId = await searchPlace(`${facility.name} ${queryAddress}`);
        if (placeId) {
            const details = await getPlaceDetails(placeId);
            if (details) {
                const notes = [];
                if (isEnglishAddress(details.formattedAddress)) notes.push('English Address Detected');

                const cleanedPhone = cleanPhoneNumber(details.phone);
                if (cleanedPhone !== details.phone) {
                    details.phone = cleanedPhone;
                    notes.push('Phone Cleaned');
                }

                candidates.push({
                    db_id: facility.id,
                    original_name: facility.name,
                    original_address: facility.address,
                    google_data: details,
                    status: 'match',
                    notes: notes
                });
            }
        }
    }

    const jsonPath = path.resolve(process.cwd(), 'scripts', `google_enrichment_candidates_validation.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(candidates, null, 2));
    console.log(`✅ Validation JSON Created: ${jsonPath}`);
}

main().catch(console.error);
