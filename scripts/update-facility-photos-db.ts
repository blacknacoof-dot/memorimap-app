
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load photo mapping
const mappingPath = path.join(__dirname, 'facility_photos_mapping.json');
const photoMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

async function updateFacilityPhotos() {
    console.log('=== Updating Facility Photos in Database ===\n');

    for (const facility of photoMapping) {
        // Find facility by name
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, image_url, gallery_images')
            .ilike('name', `%${facility.facilityName}%`)
            .limit(1);

        if (error) {
            console.error(`Error finding ${facility.facilityName}:`, error.message);
            continue;
        }

        if (!data || data.length === 0) {
            console.log(`⚠️ Not found: ${facility.facilityName}`);
            continue;
        }

        const dbFacility = data[0];
        const mainImage = facility.urls[0];
        const galleryImages = facility.urls;

        // Update the facility
        const { error: updateError } = await supabase
            .from('memorial_spaces')
            .update({
                image_url: mainImage,
                gallery_images: galleryImages,
            })
            .eq('id', dbFacility.id);

        if (updateError) {
            console.error(`Failed to update ${facility.facilityName}:`, updateError.message);
        } else {
            console.log(`✅ ${facility.facilityName} (ID: ${dbFacility.id})`);
            console.log(`   Main: ${mainImage}`);
            console.log(`   Gallery: ${galleryImages.length} photos`);
        }

        // Also add to facility_images table
        for (const url of facility.urls) {
            const { error: insertErr } = await supabase
                .from('facility_images')
                .upsert({
                    facility_id: dbFacility.id,
                    image_url: url,
                    is_active: true,
                }, { onConflict: 'facility_id,image_url' });

            if (insertErr && !insertErr.message.includes('duplicate')) {
                console.log(`   Warning: ${insertErr.message}`);
            }
        }
    }

    console.log('\n✅ Done!');
}

updateFacilityPhotos();
