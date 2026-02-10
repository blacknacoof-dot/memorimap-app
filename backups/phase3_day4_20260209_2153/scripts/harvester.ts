/**
 * Harvester Engine for Nationwide Facility Data
 * 
 * Collects data from Kakao Local API and upserts into Supabase.
 * Run this script using: npx tsx scripts/harvester.ts
 */

import { createClient } from '@supabase/supabase-js';
import { DISTRICTS } from './data/districts';
import * as fs from 'fs';
import * as path from 'path';

// --- Helper to load .env.local manually for Node.js scripts ---
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;

            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (value) {
                    process.env[key.trim()] = value;
                }
            }
        });
    }
}

loadEnv();

// --- Configuration ---
const KAKAO_REST_API_KEY = process.env.VITE_KAKAO_REST_API_KEY || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!KAKAO_REST_API_KEY) console.error('❌ Missing VITE_KAKAO_REST_API_KEY');
if (!SUPABASE_URL) console.error('❌ Missing VITE_SUPABASE_URL');
if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY) console.error('❌ Missing Supabase API Key');

if (!KAKAO_REST_API_KEY || !SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY)) {
    process.exit(1);
}

// Prefer Service Role Key for bypassing RLS during harvesting
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

const KEYWORDS = ["추모공원", "장례식장", "봉안당", "수목장", "바다장", "반려동물 장례", "동물 장묘"];

// --- Helper Functions ---

/**
 * Maps Kakao category name to our facility type
 */
function mapCategoryToType(categoryName: string): 'charnel' | 'park' | 'natural' | 'complex' | 'sea' | 'pet' {
    if (categoryName.includes('동물') || categoryName.includes('펫') || categoryName.includes('강아지') || categoryName.includes('고양이')) return 'pet';
    if (categoryName.includes('납골') || categoryName.includes('봉안')) return 'charnel';
    if (categoryName.includes('수목장')) return 'natural';
    if (categoryName.includes('공원묘지')) return 'park';
    if (categoryName.includes('바다장')) return 'sea';
    return 'complex'; // Default
}

/**
 * Normalizes Kakao API results to our database schema
 */
function normalizeData(kakaoPlace: any) {
    return {
        id: kakaoPlace.id,
        name: kakaoPlace.place_name,
        type: mapCategoryToType(kakaoPlace.category_name),
        religion: 'none', // Kakao doesn't provide religion, default to none
        address: kakaoPlace.road_address_name || kakaoPlace.address_name,
        lat: parseFloat(kakaoPlace.y),
        lng: parseFloat(kakaoPlace.x),
        phone: kakaoPlace.phone || null,
        image_url: null, // Kakao Search API doesn't provide image directly
        description: kakaoPlace.place_url, // Use Kakao Place URL as description for now
        features: [kakaoPlace.category_name]
    };
}

/**
 * Searches for facilities in a specific district with a keyword
 */
async function searchByDistrict(district: string, keyword: string) {
    const query = `${district} ${keyword}`;
    console.log(`🔍 Searching: [${query}]`);

    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=15`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Kakao API Error: ${response.status} ${errorText}`);
            return [];
        }

        const data = await response.json();
        return data.documents || [];
    } catch (error) {
        console.error(`❌ Network Error searching ${query}:`, error);
        return [];
    }
}

/**
 * Main Harvest Process
 */
async function harvest() {
    console.log('🚀 Starting Harvester Engine...\n');

    let totalSaved = 0;

    for (const district of DISTRICTS) {
        console.log(`\n📍 Processing District: ${district}`);

        for (const keyword of KEYWORDS) {
            const places = await searchByDistrict(district, keyword);

            if (places.length === 0) continue;

            const normalizedPlaces = places.map(normalizeData);

            const { error } = await supabase
                .from('memorial_spaces')
                .upsert(normalizedPlaces, { onConflict: 'id' });

            if (error) {
                console.error(`❌ Error upserting data for ${district} ${keyword}:`, error);
            } else {
                console.log(`✅ Saved ${places.length} facilities for [${district} ${keyword}]`);
                totalSaved += places.length;
            }

            // Small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`\n🎉 Harvest completed! Total facilities saved: ${totalSaved}`);
}

harvest();
