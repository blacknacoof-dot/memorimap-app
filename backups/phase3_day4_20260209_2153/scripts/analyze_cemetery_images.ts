
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCemeteryImages() {
    console.log('🔍 Analyzing Cemetery (공원묘지) Images...');

    // 1. Fetch relevant facilities
    // Categories mapping to 'park'/'cemetery' in App.tsx logic:
    // 'park_cemetery', 'park', 'complex', 'cemetery'
    const targetCategories = ['park_cemetery', 'park', 'complex', 'cemetery', 'ossuary_park'];

    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('id, name, category, images, image_url')
        .in('category', targetCategories);

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log(`📋 Total Cemetery Facilities found: ${facilities.length}`);

    let realImageCount = 0;
    let placeholderCount = 0;
    const realImageExamples: string[] = [];
    const badPatterns = [
        'placeholder', 'placehold.it', 'placehold.co',
        'unsplash', 'mediahub.seoul.go.kr',
        'noimage', 'no-image', 'guitar', 'defaults'
    ];

    const isRealImage = (url: string | null | undefined) => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return !badPatterns.some(pattern => lowerUrl.includes(pattern));
    };

    for (const facility of facilities) {
        let hasReal = false;

        // Check images array
        if (Array.isArray(facility.images) && facility.images.length > 0) {
            // Check if ANY image in the array is real
            if (facility.images.some((img: string) => isRealImage(img))) {
                hasReal = true;
            }
        }

        // Check image_url column if array check failed (or as fallback logic similar to App.tsx)
        if (!hasReal && isRealImage(facility.image_url)) {
            hasReal = true;
        }

        if (hasReal) {
            realImageCount++;
            if (realImageExamples.length < 10) {
                realImageExamples.push(`${facility.name} (ID: ${facility.id})`);
            }
        } else {
            placeholderCount++;
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Facilities with REAL images: ${realImageCount}`);
    console.log(`❌ Facilities with PLACEHOLDER/NO images: ${placeholderCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Examples of facilities with real images:');
    realImageExamples.forEach(name => console.log(` - ${name}`));
}

checkCemeteryImages();
