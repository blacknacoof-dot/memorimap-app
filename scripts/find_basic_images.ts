
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs'; // Added static import

// Load environment variables
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    console.log('Available keys:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findBasicImages() {
    console.log('Fetching memorial spaces...');
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, image_url, category')
        .eq('category', '장례식장'); // Filter by Funeral Home

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log(`Fetched ${facilities.length} funeral homes.`);

    const imageCounts: Record<string, number> = {};
    const imageToFacilities: Record<string, { id: number; name: string }[]> = {};

    facilities.forEach((f: any) => {
        // Handle both cases if uncertain: image_url might be string or array
        let images: string[] = [];
        if (Array.isArray(f.image_url)) {
            images = f.image_url;
        } else if (typeof f.image_url === 'string') {
            // Is it a JSON string or just a URL?
            if (f.image_url.startsWith('[')) {
                try {
                    images = JSON.parse(f.image_url);
                } catch (e) {
                    images = [f.image_url];
                }
            } else {
                images = [f.image_url];
            }
        }

        if (images.length > 0) {
            const firstImage = images[0]; // Assuming the first image is the main one used
            // Check if it matches the identified basic image or is just common
            imageCounts[firstImage] = (imageCounts[firstImage] || 0) + 1;

            if (!imageToFacilities[firstImage]) {
                imageToFacilities[firstImage] = [];
            }
            imageToFacilities[firstImage].push({ id: f.id, name: f.name });
        } else {
            // No images
            imageCounts['NO_IMAGE'] = (imageCounts['NO_IMAGE'] || 0) + 1;
        }
    });

    // Sort by count
    const sortedImages = Object.entries(imageCounts).sort((a, b) => b[1] - a[1]);

    console.log('\nTop 10 most common images:');
    sortedImages.slice(0, 10).forEach(([url, count], index) => {
        console.log(`${index + 1}. [Count: ${count}] ${url}`);
    });

    // Write to CSV
    if (sortedImages.length > 0) {
        const topImage = sortedImages[0][0];
        if (topImage !== 'NO_IMAGE') {
            console.log(`\nFound basic image: ${topImage}`);
            console.log(`Writing list to basic_image_facilities.csv...`);

            const targetFacilities = imageToFacilities[topImage];
            const csvContent = "id,name,image_url\n" + targetFacilities.map(f => `${f.id},"${f.name}","${topImage}"`).join("\n");

            const outputPath = path.resolve(__dirname, '../basic_image_facilities.csv');
            fs.writeFileSync(outputPath, csvContent, 'utf-8');
            console.log(`Successfully wrote ${targetFacilities.length} facilities to ${outputPath}`);
        }
    }
}

findBasicImages();
