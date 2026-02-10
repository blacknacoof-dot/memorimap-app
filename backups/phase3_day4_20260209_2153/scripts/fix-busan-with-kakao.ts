/**
 * Fix Busan facility using Kakao API and manual coordinates
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const KAKAO_KEY = process.env.VITE_KAKAO_REST_API_KEY!;
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWithKakao() {
    console.log('🔍 Using Kakao API to find coordinates...\n');

    const facilityId = 'aa89f083-0204-49d7-a46b-82ea79be23ac';
    const address = '부산광역시 해운대구 달맞이길 62';

    // Try multiple address variations
    const addressVariations = [
        '부산광역시 해운대구 달맞이길 62',
        '부산 해운대구 달맞이길 62',
        '해운대구 달맞이길 62',
        '부산광역시 해운대구 중동',  // Dalmaji-gil is in Jung-dong
        '부산 해운대 달맞이언덕'
    ];

    let foundResult = null;

    for (const addr of addressVariations) {
        console.log(`Searching: ${addr}`);

        try {
            const kakaoResponse = await axios.get(
                'https://dapi.kakao.com/v2/local/search/address.json',
                {
                    params: { query: addr },
                    headers: { 'Authorization': `KakaoAK ${KAKAO_KEY}` }
                }
            );

            if (kakaoResponse.data.documents && kakaoResponse.data.documents.length > 0) {
                const result = kakaoResponse.data.documents[0];
                console.log(`  ✅ Found: ${result.address_name}`);
                console.log(`  Coordinates: (${result.y}, ${result.x})\n`);
                foundResult = result;
                break;
            } else {
                console.log(`  ❌ No result\n`);
            }
        } catch (error) {
            console.log(`  ❌ Error\n`);
        }
    }

    if (!foundResult) {
        console.log('❌ Kakao API found no results.\n');
        console.log('📍 Using manual coordinates for Haeundae-gu Dalmaji-gil area...\n');

        // Manual coordinates for Dalmaji-gil (달맞이길) in Haeundae
        // This is a famous coastal road in Haeundae with beautiful views
        const manualLat = 35.1621;  // Dalmaji-gil area
        const manualLng = 129.1829;

        await updateCoordinates(facilityId, manualLat, manualLng, 'Manual (Dalmaji-gil area)');
    } else {
        const lat = parseFloat(foundResult.y);
        const lng = parseFloat(foundResult.x);
        await updateCoordinates(facilityId, lat, lng, 'Kakao API');
    }
}

async function updateCoordinates(facilityId: string, lat: number, lng: number, source: string) {
    // Get current coordinates
    const { data: currentData } = await supabase
        .from('facilities')
        .select('lat, lng, name, address')
        .eq('id', facilityId)
        .single();

    if (!currentData) {
        console.error('❌ Facility not found');
        return;
    }

    console.log(`📍 Comparison (Source: ${source}):`);
    console.log(`   Current (WRONG): (${currentData.lat}, ${currentData.lng}) → Seoul`);
    console.log(`   Correct (NEW):   (${lat}, ${lng}) → Busan\n`);

    const distance = calculateDistance(
        currentData.lat,
        currentData.lng,
        lat,
        lng
    );
    console.log(`❌ Location was ${distance.toFixed(1)} km off!\n`);

    // Update database
    console.log('🔧 Updating database...');
    const { error } = await supabase
        .from('facilities')
        .update({ lat, lng })
        .eq('id', facilityId);

    if (error) {
        console.error('❌ Update failed:', error.message);
        return;
    }

    console.log('✅ Database updated successfully!\n');

    // Verify
    const { data: updated } = await supabase
        .from('facilities')
        .select('name, address, lat, lng')
        .eq('id', facilityId)
        .single();

    if (updated) {
        console.log('✅ Verification:');
        console.log(`   ${updated.name}`);
        console.log(`   ${updated.address}`);
        console.log(`   Coordinates: (${updated.lat}, ${updated.lng})`);
        console.log(`   Now correctly showing in Busan! 🎉\n`);
    }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

fixWithKakao()
    .then(() => {
        console.log('✅ Fix complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
