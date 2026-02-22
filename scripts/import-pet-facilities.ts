
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

async function searchNaver(query: string, start = 1): Promise<any[]> {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: { query, display: 5, start, sort: 'comment' }, // Sort by comment/popularity
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });
        return response.data.items || [];
    } catch (error) {
        console.error(`Search Error (${query}):`, error);
        return [];
    }
}

async function importPetFacilities() {
    console.log("🐶 Starting Import of Pet Funeral Homes from Naver...");

    // Keywords to search
    const keywords = ['반려동물장례식장', '애견장례', '동물장묘'];
    let candidates: any[] = [];

    // Fetch from Naver (Multiple pages/regions?)
    // Naver Local Search limits to 5 results per query usually if not specific.
    // We should search by Region + Keyword to get more.
    // Regions: 서울, 경기, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
    const regions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충남', '전남', '경북', '경남', '제주'];
    // Randomize or select top regions to avoid rate limit? 
    // Let's do a subset or search "전국 반려동물장례식장"? Naver doesn't support "Nationwide".
    // We will loop regions.

    for (const region of regions) {
        for (const kw of keywords) {
            const query = `${region} ${kw}`;
            console.log(`🔍 Searching: ${query}...`);

            const items = await searchNaver(query, 1);
            if (items.length > 0) {
                // Map items to our DB format
                const mapped = items.map(item => ({
                    name: item.title.replace(/<[^>]*>/g, ''),
                    address: item.roadAddress || item.address,
                    phone: item.telephone,
                    type: 'pet'
                }));
                candidates.push(...mapped);
            }
            // Rate Limit protection (10 req/sec OK, but stay safe)
            await new Promise(r => setTimeout(r, 200));
        }
    }

    // Deduplicate candidates by name + address (simple check)
    candidates = candidates.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i); // Simply name for now

    console.log(`📋 Found ${candidates.length} candidates from Naver.`);

    // Check against existing DB to avoid duplicates
    const { data: existing } = await supabase.from('memorial_spaces').select('name, address');
    if (!existing) return;

    const existingNames = new Set(existing.map(e => e.name.replace(/ /g, '')));

    const newFacilities = candidates.filter(c => {
        const cleanName = c.name.replace(/ /g, '');
        // Also check if existing DB has it.
        // Fuzzy check?
        return !existingNames.has(cleanName);
    });

    console.log(`✨ Identifying ${newFacilities.length} NEW facilities to insert.`);

    if (newFacilities.length === 0) {
        console.log("✅ No new facilities to add.");
        return;
    }

    // Insert
    // Use upsert or insert? Insert.
    // Need to handle missing fields like lat/lng? (Can verify later)
    // For now just basic info.
    const records = newFacilities.map(f => ({
        name: f.name,
        address: f.address,
        phone: f.phone,
        type: 'pet',
        data_source: 'naver_import',
        is_verified: true // It came from Naver, so verified existence?
    }));

    const { error } = await supabase.from('memorial_spaces').insert(records);

    if (error) {
        console.error("❌ Insert Failed:", error);
    } else {
        console.log(`✅ Successfully inserted ${records.length} pet facilities.`);
    }
}

importPetFacilities();
