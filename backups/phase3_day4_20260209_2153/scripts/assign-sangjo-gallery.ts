import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('\n❌ Missing Supabase credentials in .env.local');
    console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOURCE_DIR = 'C:/Users/black/Desktop/memorimap/data/상조서비스 이미지_최적화';
const BUCKET_NAME = 'sangjo-gallery';

interface Facility {
    id: string;
    name: string;
    category: string;
    gallery_images: string[] | null;
}

/**
 * Upload images to Supabase Storage
 */
async function uploadImages(): Promise<string[]> {
    console.log('\n📤 Step 1: Uploading images to Supabase Storage...\n');

    // Check if bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
        console.log(`Creating bucket: ${BUCKET_NAME}`);
        const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 5242880, // 5MB
        });
        if (error) {
            console.error('❌ Error creating bucket:', error);
            throw error;
        }
    }

    // Get all JPG files from the optimized directory
    const files = fs.readdirSync(SOURCE_DIR).filter(file =>
        /\.(jpg|jpeg)$/i.test(file)
    );

    console.log(`Found ${files.length} images to upload`);

    const uploadedUrls: string[] = [];

    for (const file of files) {
        const filePath = path.join(SOURCE_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);

        // Generate a clean filename
        const cleanFilename = file
            .replace(/Image_fx \((\d+)\)\.jpg/i, 'sangjo_$1.jpg')
            .replace(/상조 서비스 이미지(\d*)\.jpg/i, (_, num) =>
                num ? `sangjo_service_${num}.jpg` : 'sangjo_service.jpg'
            );

        try {
            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(cleanFilename, fileBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true, // Overwrite if exists
                });

            if (error) {
                console.error(`❌ Error uploading ${file}:`, error.message);
                continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(cleanFilename);

            uploadedUrls.push(publicUrl);
            console.log(`✓ Uploaded: ${cleanFilename}`);
        } catch (err) {
            console.error(`❌ Failed to upload ${file}:`, err);
        }
    }

    console.log(`\n✅ Successfully uploaded ${uploadedUrls.length}/${files.length} images\n`);
    return uploadedUrls;
}

/**
 * Get random sample from array
 */
function getRandomSample<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Assign images to Sangjo companies
 */
async function assignGalleryImages(imageUrls: string[]) {
    console.log('\n🎲 Step 2: Assigning random images to Sangjo companies...\n');

    // Fetch all Sangjo companies from funeral_companies table
    const { data: facilities, error } = await supabase
        .from('funeral_companies')
        .select('id, name, gallery_images');

    if (error) {
        console.error('❌ Error fetching facilities:', error.message);
        throw error;
    }

    if (!facilities || facilities.length === 0) {
        console.log('⚠️  No Sangjo companies found in database');
        return;
    }

    console.log(`Found ${facilities.length} Sangjo companies\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const facility of facilities as Facility[]) {
        // Select 4 random images for this facility
        const selectedImages = getRandomSample(imageUrls, 4);

        try {
            const { error: updateError } = await supabase
                .from('funeral_companies')
                .update({ gallery_images: selectedImages })
                .eq('id', facility.id);

            if (updateError) {
                console.error(`❌ Error updating ${facility.name}:`, updateError.message);
                errorCount++;
                continue;
            }

            successCount++;
            console.log(`✓ ${facility.name}: Assigned ${selectedImages.length} images`);
        } catch (err) {
            console.error(`❌ Failed to update ${facility.name}:`, err);
            errorCount++;
        }
    }

    console.log(`\n✅ Gallery assignment complete!`);
    console.log(`   Success: ${successCount}/${facilities.length}`);
    console.log(`   Errors: ${errorCount}`);
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Starting Sangjo Gallery Image Assignment\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Upload images
        const uploadedUrls = await uploadImages();

        if (uploadedUrls.length === 0) {
            console.error('❌ No images were uploaded. Aborting.');
            process.exit(1);
        }

        // Step 2: Assign to facilities
        await assignGalleryImages(uploadedUrls);

        console.log('\n' + '='.repeat(60));
        console.log('✅ All operations completed successfully!');
        console.log('='.repeat(60) + '\n');
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
