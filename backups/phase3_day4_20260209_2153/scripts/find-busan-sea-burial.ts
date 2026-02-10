/**
 * Search for specific Busan sea burial facility
 * Based on user's screenshot showing "부산 연안 해양장"
 */

import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findBusanSeaBurial() {
    console.log('🔍 Searching for Busan sea burial facility...\n');

    // Try multiple search patterns
    const searchPatterns = [
        '%연안%',
        '%해양장%',
        '%부산%해양%',
        '%해운대%'
    ];

    for (const pattern of searchPatterns) {
        console.log(`Searching with pattern: ${pattern}`);

        const { data, error } = await supabase
            .from('facilities')
            .select('id, name, category, address, lat, lng')
            .or(`name.ilike.${pattern},address.ilike.${pattern}`)
            .eq('category', 'sea_burial');

        if (error) {
            console.error(`Error: ${error.message}`);
            continue;
        }

        if (data && data.length > 0) {
            console.log(`\n✅ Found ${data.length} result(s):\n`);
            data.forEach(facility => {
                console.log(`📍 ${facility.name}`);
                console.log(`   Address: ${facility.address}`);
                console.log(`   Coordinates: (${facility.lat}, ${facility.lng})`);
                console.log(`   Category: ${facility.category}`);
                console.log(`   ID: ${facility.id}`);

                // Check which region these coordinates fall into
                const region = getRegionFromCoordinates(facility.lat, facility.lng);
                console.log(`   Detected Region: ${region}\n`);
            });
        } else {
            console.log('   No results\n');
        }
    }

    // Also search ALL sea burial facilities in Busan
    console.log('🌊 All sea_burial facilities in Busan area:\n');

    const { data: allSeaBurial, error: allError } = await supabase
        .from('facilities')
        .select('id, name, category, address, lat, lng')
        .eq('category', 'sea_burial')
        .or('address.ilike.%부산%,address.ilike.%해운대%');

    if (!allError && allSeaBurial && allSeaBurial.length > 0) {
        console.log(`Found ${allSeaBurial.length} sea burial facilities in Busan:\n`);
        allSeaBurial.forEach(facility => {
            const region = getRegionFromCoordinates(facility.lat, facility.lng);
            const match = region.includes('부산') ? '✅' : '❌';
            console.log(`${match} ${facility.name}`);
            console.log(`   ${facility.address}`);
            console.log(`   Coords: (${facility.lat}, ${facility.lng}) → ${region}\n`);
        });
    } else {
        console.log('No sea burial facilities found with Busan address.');
    }
}

function getRegionFromCoordinates(lat: number, lng: number): string {
    const REGION_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
        '서울': { minLat: 37.4, maxLat: 37.7, minLng: 126.7, maxLng: 127.2 },
        '부산': { minLat: 35.0, maxLat: 35.4, minLng: 128.9, maxLng: 129.3 },
        '인천': { minLat: 37.3, maxLat: 37.6, minLng: 126.4, maxLng: 126.8 },
        '대구': { minLat: 35.7, maxLat: 36.0, minLng: 128.4, maxLng: 128.8 },
        '광주': { minLat: 35.0, maxLat: 35.3, minLng: 126.7, maxLng: 127.0 },
        '경기': { minLat: 36.8, maxLat: 38.3, minLng: 126.4, maxLng: 127.6 },
        '강원': { minLat: 37.0, maxLat: 38.6, minLng: 127.5, maxLng: 129.4 },
        '경남': { minLat: 34.7, maxLat: 35.9, minLng: 127.7, maxLng: 129.3 }
    };

    for (const [region, bounds] of Object.entries(REGION_BOUNDS)) {
        if (
            lat >= bounds.minLat &&
            lat <= bounds.maxLat &&
            lng >= bounds.minLng &&
            lng <= bounds.maxLng
        ) {
            return region;
        }
    }

    return 'UNKNOWN';
}

findBusanSeaBurial()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
