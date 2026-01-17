
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Key');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkImageStats() {
    console.log('--- 🖼️  Funeral Home Image Statistics ---');

    // 1. Get all funeral homes
    const { data, error } = await supabase
        .from('facilities')
        .select('id, name, images')
        .eq('category', 'funeral_home');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    const total = data.length;
    let nullOrEmptyCount = 0;
    let hasImageCount = 0;
    const imageCounts: Record<string, number> = {};

    data.forEach(f => {
        // Check if null or empty array
        if (!f.images || f.images.length === 0) {
            nullOrEmptyCount++;
        } else {
            hasImageCount++;
            // Check the first image URL to find duplicates
            const firstImage = f.images[0];
            imageCounts[firstImage] = (imageCounts[firstImage] || 0) + 1;
        }
    });

    console.log(`Total Funeral Homes: ${total}`);
    console.log(`❌ No Image (Null/Empty): ${nullOrEmptyCount} (${((nullOrEmptyCount / total) * 100).toFixed(1)}%)`);
    console.log(`✅ Has Image Data: ${hasImageCount}`);

    // Find most common images
    const sortedImages = Object.entries(imageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5

    if (sortedImages.length > 0) {
        console.log('\n--- Top Repeated Images (Possible Defaults in DB) ---');
        sortedImages.forEach(([url, count]) => {
            console.log(`[Count: ${count}] URL: ${url.substring(0, 50)}...`);
        });
    } else {
        console.log('\nNo repeated images found.');
    }
}

checkImageStats();
