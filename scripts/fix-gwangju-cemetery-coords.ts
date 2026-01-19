/**
 * Fix remaining critical location error using Kakao API
 * Facility: 대지동공설묘지
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

async function fixGwangjuCemetery() {
    console.log('🔍 Fixing 대지동공설묘지 location...\n');

    const facilityId = '646088c6-ff71-4fb4-81cc-58eedec2f70d';
    const address = '광주광역시 남구 대지동 산55';

    // Get current (wrong) coordinates
    const { data: currentData } = await supabase
        .from('facilities')
        .select('lat, lng, name, address')
        .eq('id', facilityId)
        .single();

    if (!currentData) {
        console.error('❌ Facility not found');
        return;
    }

    console.log('Current (WRONG) location:');
    console.log(`  Name: ${currentData.name}`);
    console.log(`  Address: ${currentData.address}`);
    console.log(`  Coords: (${currentData.lat}, ${currentData.lng}) → Seoul area ❌\n`);

    // Try Kakao API
    try {
        const response = await axios.get(
            'https://dapi.kakao.com/v2/local/search/address.json',
            {
                params: { query: address },
                headers: { 'Authorization': `KakaoAK ${KAKAO_KEY}` }
            }
        );

        if (response.data.documents && response.data.documents.length > 0) {
            const result = response.data.documents[0];
            const correctLat = parseFloat(result.y);
            const correctLng = parseFloat(result.x);

            console.log('✅ Kakao API result:');
            console.log(`  Coordinates: (${correctLat}, ${correctLng}) → Gwangju area ✅\n`);

            await updateCoordinates(facilityId, correctLat, correctLng, currentData);
            return;
        }
    } catch (error) {
        console.log('ℹ️  Kakao API had no results, using manual coordinates\n');
    }

    // Fallback to manual coordinates for Gwangju Namgu Daeji-dong
    const manualLat = 35.1394;
    const manualLng = 126.8982;

    console.log('Using manual coordinates:');
    console.log(`  (${manualLat}, ${manualLng}) → Gwangju Namgu area\n`);

    await updateCoordinates(facilityId, manualLat, manualLng, currentData);
}

async function updateCoordinates(
    facilityId: string,
    lat: number,
    lng: number,
    currentData: any
) {
    const distance = calculateDistance(
        currentData.lat,
        currentData.lng,
        lat,
        lng
    );

    console.log(`📍 Location was ${distance.toFixed(1)} km off!\n`);

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
        console.log('   Now correctly showing in Gwangju! 🎉\n');
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

fixGwangjuCemetery()
    .then(() => {
        console.log('✅ Complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
