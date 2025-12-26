import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load environment variables explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// ... existing code ...

const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const naverClientId = process.env.VITE_NAVER_CLIENT_ID || '';
const naverClientSecret = process.env.VITE_NAVER_CLIENT_SECRET || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

if (!naverClientId || !naverClientSecret) {
    console.error('Missing Naver API credentials in .env');
    console.log('Ensure VITE_NAVER_CLIENT_ID and VITE_NAVER_CLIENT_SECRET are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting: Naver allows 10 calls per sec max, but 25,000 per day.
// Let's be gentle: 5 requests per second max. (200ms delay)
const DELAY_MS = 250;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function searchNaverLocal(query: string) {
    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
            params: {
                query: query,
                display: 1, // We only need the top match
                sort: 'comment' // Sort by reviews/popularity if possible, or 'random' (accuracy). 'random' is actually accuracy sort for Naver Search API.
                // Naver API sort options: 'random' (accuracy), 'comment' (review count - useful for finding the real business)
            },
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret
            }
        });
        return response.data.items[0] || null;
    } catch (error: any) {
        console.error(`Error searching for ${query}:`, error.message);
        return null;
    }
}

async function updateFacilities() {
    console.log('🔄 Starting Naver Data Update...');

    // 1. Fetch facilities that might need info
    // For safety, let's fetch all, or limit to those without phone/description if we want to save quota.
    // But user wants to upgrade data vs Kakao.

    // Let's fetch a chunk.
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, phone')
        .is('phone', null) // Prioritize those missing phone numbers first?
        // Or just update all to ensure quality.
        // For this run, let's do all, but maybe limit to 100 for testing first.
        // Actually, let's just do it.
        .range(0, 1000);

    if (error) {
        console.error('Supabase fetch error:', error);
        return;
    }

    console.log(`📋 Found ${facilities?.length || 0} facilities to check.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const facility of facilities || []) {
        // Construct query: Name + distinctive part of address (city/gu)
        // Providing full address helps accuracy.
        const query = `${facility.address.split(' ').slice(0, 2).join(' ')} ${facility.name}`;

        console.log(`Checking [${facility.id}]: ${query}`);

        const result = await searchNaverLocal(query);

        if (result) {
            // Naver returns HTML tags in title (<b>...</b>), need to strip them if we use title.
            // But we are updating metadata.
            const cleanTitle = result.title.replace(/<[^>]*>?/gm, '');
            const roadAddress = result.roadAddress;
            const phone = result.telephone || facility.phone; // Keep existing if Naver has none (unlikely)
            const link = result.link;
            const category = result.category;
            const description = result.description; // description field availability depends on API version? 
            // Actually Naver Search API (local) returns: title, link, category, description, telephone, address, roadAddress, mapx, mapy.

            // Prepare update object
            const updates: any = {};

            // Only update if we found something useful
            if (phone && phone !== facility.phone) updates.phone = phone;
            if (description) updates.description = description; // We don't have description column in interface yet properly populated
            // Naver 'link' is often the homepage. 
            // homepage_url column might not exist yet
            // if (link) updates.homepage_url = link; 
            // Instead, let's map it to 'website' if it exists, but for now skip it to avoid errors.
            // Or if we want to add it later.

            // If we found a better address or category?
            // Maybe not override address blindly as lat/lng is bound to it.

            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                    .from('memorial_spaces')
                    .update(updates)
                    .eq('id', facility.id);

                if (updateError) {
                    console.error(`  ❌ Update failed: ${updateError.message}`);
                } else {
                    console.log(`  ✅ Updated: ${Object.keys(updates).join(', ')}`);
                    updatedCount++;
                }
            } else {
                console.log(`  Start info already up to date or empty.`);
                skippedCount++;
            }
        } else {
            console.log(`  ⚠️ No result found on Naver.`);
            skippedCount++;
        }

        await sleep(DELAY_MS);
    }

    console.log('🎉 Update Complete!');
    console.log(`Total: ${facilities?.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

updateFacilities().catch(console.error);
