import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
// IMPORTANT: Use SERVICE_ROLE_KEY to bypass RLS policies for bulk updates
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Constants - Using absolute path for safety as requested
const DATA_DIR = 'C:/Users/black/Desktop/memorimap/data';

const BUCKET = 'facility-images';
const FOLDER = 'defaults';
const TIMESTAMP = Date.now(); // Current session timestamp

// Image Mapping Definition
const imageMap = [
    { file: '장례식장 대표이미지.jpg', type: 'funeral' },
    { file: '봉안시설 대표이미지.jpg', type: 'charnel' },
    { file: '자연장 대표이미지.jpg', type: 'natural' },
    { file: '공원묘지 대표이미지.jpg', type: 'park' },
    { file: '동물장례 대표이미지.jpg', type: 'pet' },
    { file: '해양장 대표이미지.jpg', type: 'sea' },
    { file: '공원묘지 대표이미지.jpg', type: 'complex' }, // Using park image for complex
    { file: '장례식장 대표이미지.jpg', type: 'sangjo' },  // Using funeral image for sangjo
];

/**
 * Helper to split array into chunks (Supabase .in() has limits on list size)
 */
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

/**
 * 1. Upload new images with current timestamp
 */
async function uploadNewImages() {
    console.log(`\n🚀 [1/3] Uploading new images (Timestamp: ${TIMESTAMP})...`);
    const urlMap: Record<string, string> = {};

    const uploadPromises = imageMap.map(async (item) => {
        const localPath = path.join(DATA_DIR, item.file);
        // Create a unique path: defaults/funeral_1736253.jpg
        const storagePath = `${FOLDER}/${item.type}_${TIMESTAMP}.jpg`;

        if (!fs.existsSync(localPath)) {
            console.warn(`   ⚠️ File not found: ${localPath}`);
            return;
        }

        const fileBuffer = fs.readFileSync(localPath);

        // Parallel Upload
        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });

        if (error) {
            console.error(`   ❌ Failed to upload ${item.type}:`, error.message);
            return;
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        urlMap[item.type] = data.publicUrl;
        console.log(`   ✅ Uploaded: ${item.type} -> .../${storagePath}`);
    });

    await Promise.all(uploadPromises);
    return urlMap;
}

/**
 * 2. Delete old default images to keep storage clean
 */
async function cleanupOldImages() {
    console.log(`\n🧹 [2/3] Cleaning up old images in '${FOLDER}/'...`);

    // List all files in 'defaults' folder
    const { data: files, error } = await supabase.storage.from(BUCKET).list(FOLDER, { limit: 100 });

    if (error || !files) {
        console.error('   ❌ Failed to list files:', error?.message);
        return;
    }

    // Filter files that are NOT the current timestamp
    // We assume files are named like "type_123456.jpg"
    const filesToDelete = files
        .filter(f => f.name.includes('_') && !f.name.includes(String(TIMESTAMP)))
        .map(f => `${FOLDER}/${f.name}`);

    if (filesToDelete.length === 0) {
        console.log('   ✨ No old files to clean.');
        return;
    }

    console.log(`   Found ${filesToDelete.length} old files. Deleting...`);

    const { error: delError } = await supabase.storage.from(BUCKET).remove(filesToDelete);
    if (delError) {
        console.error('   ❌ Delete failed:', delError.message);
    } else {
        console.log('   🗑️ Cleanup complete.');
    }
}

/**
 * 3. Batch update database records
 */
async function batchUpdateFacilities(urlMap: Record<string, string>) {
    console.log(`\n💾 [3/3] Fetching and Batch Updating DB...`);

    // Fetch all IDs, types, and current image_urls
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, type, name, image_url');

    if (error || !facilities) {
        console.error('   ❌ Failed to fetch facilities:', error?.message);
        return;
    }

    // Group IDs by the Target URL they need
    // key: Target Image URL, value: Array of Facility IDs
    const batchGroups: Record<string, string[]> = {};
    let updateCount = 0;

    for (const f of facilities) {
        let needsFix = false;

        // Condition Check Logic
        if (!f.image_url ||
            f.image_url === '' ||
            f.image_url.includes('placeholder') ||
            f.image_url.includes('placehold.it') ||
            f.image_url.includes('placehold.co') ||
            f.image_url.includes('unsplash') ||
            f.image_url.includes('defaults/') || // Update even if it has a default (to get the new timestamp)
            f.image_url.includes('mediahub.seoul.go.kr') // Specific fix
        ) {
            needsFix = true;
        }

        if (needsFix) {
            // Determine target URL based on type (fallback to funeral if type not found)
            const targetUrl = urlMap[f.type] || urlMap['funeral'];

            if (targetUrl) {
                if (!batchGroups[targetUrl]) {
                    batchGroups[targetUrl] = [];
                }
                batchGroups[targetUrl].push(f.id);
                updateCount++;
            }
        }
    }

    console.log(`   🎯 Identified ${updateCount} records to update.`);

    // Execute Batch Updates in Parallel
    // We group by URL, so we do: UPDATE table SET image_url = 'X' WHERE id IN (...ids)
    const updatePromises = Object.entries(batchGroups).map(async ([targetUrl, ids]) => {
        // Supabase .in() might fail if array is too large, so we chunk IDs (e.g., 500 at a time)
        const idChunks = chunkArray(ids, 500);

        for (const chunk of idChunks) {
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ image_url: targetUrl })
                .in('id', chunk);

            if (updateError) {
                console.error(`   ❌ Failed to update batch for ${targetUrl.split('/').pop()}:`, updateError.message);
            } else {
                console.log(`      ✨ Updated batch of ${chunk.length} records -> ${targetUrl.split('/').pop()}`);
            }
        }
    });

    await Promise.all(updatePromises);
}

// --- Main Execution ---
async function run() {
    console.time('Total Execution Time');
    try {
        // Step 1: Upload & Get URLs
        const urlMap = await uploadNewImages();

        // Step 2: Cleanup Old Files
        await cleanupOldImages();

        // Step 3: Batch Update DB
        if (urlMap && Object.keys(urlMap).length > 0) {
            await batchUpdateFacilities(urlMap);
        } else {
            console.error('   ❌ No images uploaded, skipping DB update.');
        }

    } catch (e) {
        console.error('Unexpected Error:', e);
    }
    console.log('\n-----------------------------------');
    console.timeEnd('Total Execution Time');
    console.log('✅ All operations finished.');
}

run();
