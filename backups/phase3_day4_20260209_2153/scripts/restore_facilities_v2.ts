import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Backup Paths
const BACKUP_DIR = path.join(process.cwd(), 'backups/backup_2026-01-15T01-08-05-364Z');
const FACILITIES_CSV = path.join(BACKUP_DIR, 'memorial_spaces.csv');
const IMAGES_CSV = path.join(BACKUP_DIR, 'facility_images.csv');

async function restoreFacilities() {
    console.log('🚀 Starting Facility Restoration...');

    // 1. Load Images Map
    console.log('Reading Images CSV...');
    const imagesContent = fs.readFileSync(IMAGES_CSV, 'utf-8');
    const imagesRecords = parse(imagesContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true
    });

    const imagesMap = new Map<string, string[]>();
    imagesRecords.forEach((record: any) => {
        const facilityId = record.facility_id;
        const imageUrl = record.image_url;
        if (facilityId && imageUrl) {
            if (!imagesMap.has(facilityId)) {
                imagesMap.set(facilityId, []);
            }
            imagesMap.get(facilityId)?.push(imageUrl);
        }
    });
    console.log(`Loaded ${imagesRecords.length} image records.`);

    // 2. Load Facilities
    console.log('Reading Facilities CSV...');
    const facilitiesContent = fs.readFileSync(FACILITIES_CSV, 'utf-8');
    const facilitiesRecords = parse(facilitiesContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true
    }) as any[];

    console.log(`Found ${facilitiesRecords.length} facilities to restore.`);

    let successCount = 0;
    let errorCount = 0;

    // 3. Process and Insert
    const facilitiesToInsert: any[] = [];

    for (const record of facilitiesRecords) {
        try {
            // Collect Images: Main image_url + gallery images from CSV
            const galleryImages = imagesMap.get(record.id) || [];
            const mainImage = record.image_url;
            const allImages = new Set<string>();

            if (mainImage && mainImage !== 'null' && mainImage !== 'undefined') allImages.add(mainImage);
            galleryImages.forEach(img => allImages.add(img));

            // Parse features if valid JSON, else empty object
            let features = {};
            try {
                if (record.features) features = JSON.parse(record.features);
            } catch (e) { }

            // Map Category (Korean -> Enum) if needed, or use default 'complex'
            // The SQL defines default 'complex', check valid values in SQL: 'funeral_home', 'charnel_house', 'crematorium', 'natural_burial', 'complex', 'pet'
            // record.category might be "장례식장", "납골당" etc.
            let category = 'complex';
            if (record.category === '장례식장') category = 'funeral_home';
            else if (record.category === '납골당') category = 'charnel_house';
            else if (record.category === '화장장') category = 'crematorium';
            else if (record.category === '수목장' || record.category === '자연장') category = 'natural_burial';
            else if (record.type === 'pet') category = 'pet'; // Sometimes type field is used

            facilitiesToInsert.push({
                // Preserve ID if needed, but schema uses new UUID? 
                // Better to let new ID be generated OR preserve old ID in legacy_id?
                // User script bulk-add-facilities.ts used to generate new IDs. 
                // However, to keep relation with images, we might want to map things correctly.
                // But since we are aggregating images HERE, we don't need to preserve ID for relation sake anymore.
                // We'll let Postgres generate new IDs, and store old ID in legacy_id.
                legacy_id: record.id,

                name: record.name,
                category: category,
                address: record.address,
                lat: record.lat ? parseFloat(record.lat) : null,
                lng: record.lng ? parseFloat(record.lng) : null,
                phone: record.phone,
                description: record.description,
                images: Array.from(allImages),
                ai_context: record.ai_context,
                features: features,
                price_min: record.price_range === '문의' ? 0 : 0, // Simplified price
                is_verified: record.is_verified === 'true',

                // Note: address is mapped to location GEOGRAPHY automatically by triggers? No.
                // We need to set it manually or use PostGIS function.
                // Supabase-js cannot invoke PostGIS functions easily in bulk insert unless configured.
                // WE WILL INSERT RAW lat/lng and assuming we can update location later or letting client handle it.
                // The table definition has lat/lng cols now, so that's good.
            });

        } catch (e) {
            console.error(`Error processing record ${record.name}:`, e);
            errorCount++;
        }
    }

    // Batch Insert
    const BATCH_SIZE = 100;
    for (let i = 0; i < facilitiesToInsert.length; i += BATCH_SIZE) {
        const batch = facilitiesToInsert.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('facilities').insert(batch);

        if (error) {
            console.error(`Batch insert error at ${i}:`, error);
            errorCount += batch.length;
        } else {
            successCount += batch.length;
            console.log(`Inserted batch ${i} - ${i + batch.length}`);
        }
    }

    // Update Location Column using SQL (RPC call or explicit update if possible)
    // Since we don't have direct SQL access here easily, we rely on the fact that we stored lat/lng.
    // We can add a simple SQL function execution if 'rpc' is available, or just leave it for now as lat/lng are there.

    console.log(`\nRestoration Complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

restoreFacilities().catch(console.error);
