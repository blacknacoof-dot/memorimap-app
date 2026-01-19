import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSangjoFacilities() {
    console.log('🔍 Searching for Sangjo-related facilities in facilities table...\n');

    // Search by category='sangjo' OR name contains '상조' or '서비스'
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name, address, images, category')
        .or('category.eq.sangjo,name.ilike.%상조%,name.ilike.%서비스%')
        .order('name');

    if (error) {
        console.error('❌ Error fetching facilities:', error);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.log('⚠️ No sangjo-related facilities found in facilities table.');
        return;
    }

    console.log(`✅ Found ${facilities.length} sangjo-related facilities:\n`);

    const defaultImagePatterns = [
        'defaults/',
        'placeholder',
        'placehold',
        'unsplash',
        'noimage',
        'guitar'
    ];

    let hasDefaultImage = 0;
    let hasNoImage = 0;
    let hasCustomImage = 0;

    facilities.forEach((facility, index) => {
        console.log(`${index + 1}. ${facility.name}`);
        console.log(`   ID: ${facility.id}`);
        console.log(`   Category: ${facility.category || 'N/A'}`);
        console.log(`   Address: ${facility.address || 'N/A'}`);

        const mainImage = facility.images?.[0];

        if (!mainImage) {
            console.log(`   Image: ❌ NO IMAGE (empty or null)`);
            hasNoImage++;
        } else {
            const isDefault = defaultImagePatterns.some(pattern =>
                mainImage.toLowerCase().includes(pattern)
            );

            if (isDefault) {
                console.log(`   Image: ⚠️ DEFAULT IMAGE`);
                console.log(`          ${mainImage}`);
                hasDefaultImage++;
            } else {
                console.log(`   Image: ✅ Custom`);
                console.log(`          ${mainImage}`);
                hasCustomImage++;
            }
        }
        console.log('');
    });

    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total facilities found: ${facilities.length}`);
    console.log(`   ✅ Custom images: ${hasCustomImage}`);
    console.log(`   ⚠️ Default images: ${hasDefaultImage}`);
    console.log(`   ❌ No images: ${hasNoImage}`);
    console.log('='.repeat(60));
}

checkSangjoFacilities();
