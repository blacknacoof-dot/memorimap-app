/**
 * Fix Busan Sea Burial Facility using Naver Local Search API
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const NAVER_CLIENT_ID = process.env.VITE_NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.VITE_NAVER_CLIENT_SECRET!;
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface NaverLocalSearchItem {
    title: string;
    link: string;
    category: string;
    description: string;
    telephone: string;
    address: string;
    roadAddress: string;
    mapx: string; // longitude * 10,000,000
    mapy: string; // latitude * 10,000,000
}

async function fixBusanSeaBurial() {
    console.log('🔍 Searching for Busan sea burial facility using Naver Local Search API...\n');

    const facilityId = 'aa89f083-0204-49d7-a46b-82ea79be23ac';
    const facilityName = '부산 연안 해양장';
    const address = '부산광역시 해운대구 달맞이길 62';

    try {
        // Search using Naver Local Search API
        const response = await axios.get(
            'https://openapi.naver.com/v1/search/local.json',
            {
                params: {
                    query: facilityName,
                    display: 5
                },
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                }
            }
        );

        console.log(`✅ Naver Local Search successful! Found ${response.data.items.length} results\n`);

        if (response.data.items.length === 0) {
            console.log('❌ No results found. Trying alternative search...');

            // Try searching by address
            const addressResponse = await axios.get(
                'https://openapi.naver.com/v1/search/local.json',
                {
                    params: {
                        query: '해운대구 달맞이길 62',
                        display: 5
                    },
                    headers: {
                        'X-Naver-Client-Id': NAVER_CLIENT_ID,
                        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                    }
                }
            );

            if (addressResponse.data.items.length > 0) {
                console.log(`✅ Found ${addressResponse.data.items.length} results by address:\n`);
                processResults(addressResponse.data.items, facilityId, facilityName);
            } else {
                console.log('❌ No results found by address either.');
            }
            return;
        }

        processResults(response.data.items, facilityId, facilityName);

    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function processResults(items: NaverLocalSearchItem[], facilityId: string, facilityName: string) {
    console.log('Search Results:\n');

    items.forEach((item, index) => {
        const lat = parseInt(item.mapy) / 10000000;
        const lng = parseInt(item.mapx) / 10000000;

        console.log(`${index + 1}. ${item.title.replace(/<\/?b>/g, '')}`);
        console.log(`   Address: ${item.roadAddress || item.address}`);
        console.log(`   Coordinates: (${lat}, ${lng})`);
        console.log(`   Category: ${item.category}`);
        console.log('');
    });

    // Use the first result (most relevant)
    if (items.length > 0) {
        const bestMatch = items[0];
        const correctLat = parseInt(bestMatch.mapy) / 10000000;
        const correctLng = parseInt(bestMatch.mapx) / 10000000;

        console.log(`\n🎯 Using best match: ${bestMatch.title.replace(/<\/?b>/g, '')}`);
        console.log(`   Coordinates: (${correctLat}, ${correctLng})\n`);

        // Get current coordinates
        const { data: currentData } = await supabase
            .from('facilities')
            .select('lat, lng, name, address')
            .eq('id', facilityId)
            .single();

        if (currentData) {
            console.log('📍 Comparison:');
            console.log(`   Current (WRONG): (${currentData.lat}, ${currentData.lng}) → Seoul area`);
            console.log(`   Correct (NEW):   (${correctLat}, ${correctLng}) → Busan area\n`);

            const distance = calculateDistance(
                currentData.lat,
                currentData.lng,
                correctLat,
                correctLng
            );
            console.log(`❌ Error distance: ${distance.toFixed(1)} km\n`);

            // Update database
            console.log('🔧 Updating database...');
            const { error } = await supabase
                .from('facilities')
                .update({
                    lat: correctLat,
                    lng: correctLng
                })
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
                console.log(`   New coordinates: (${updated.lat}, ${updated.lng})`);
                console.log('   Now correctly showing in Busan! 🎉');
            }
        }
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

fixBusanSeaBurial()
    .then(() => {
        console.log('\n✅ Fix complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
