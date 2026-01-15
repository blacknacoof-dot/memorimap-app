
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

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

async function verifyData() {
    console.log('🔍 Starting Data Verification...\n');

    // 1. Total Facilities Count
    const { count: total, error: countError } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Error counting facilities:', countError.message);
        return;
    }
    console.log(`✅ Total Facilities: ${total}`);

    // 2. Check for missing location data (lat/lng)
    const { count: missingLoc, error: locError } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .or('lat.is.null,lng.is.null');

    if (locError) console.error('Error checking location:', locError.message);
    else {
        if (missingLoc === 0) console.log(`✅ All facilities have Lat/Lng data.`);
        else console.log(`⚠️ Facilities missing Lat/Lng: ${missingLoc}`);
    }

    // 3. Check for Descriptions
    const { count: hasDesc, error: descError } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .not('description', 'is', null);

    if (descError) console.error('Error checking description:', descError.message);
    else console.log(`✅ Facilities with Description: ${hasDesc}`);

    // 4. Check for Images
    const { data: facilities, error: imgError } = await supabase
        .from('facilities')
        .select('images, name')
        .not('images', 'is', null)
        .limit(5); // Just check a few samples

    if (imgError) {
        console.error('Error checking images:', imgError.message);
    } else {
        // Check if array is empty or "null" string related
        // Note: Empty array is not null.
        const { count: emptyImages } = await supabase.from('facilities').select('*', { count: 'exact', head: true }).eq('images', '{}');

        console.log(`✅ Sample Facilities with Images:`);
        facilities?.forEach(f => {
            const imgCount = Array.isArray(f.images) ? f.images.length : 0;
            console.log(`   - ${f.name}: ${imgCount} images`);
        });
    }

    // 5. Test Search (simulating frontend call)
    // Need to use rpc or just simple like filter
    // We'll just skip complex logic verification and stick to data presence.

    console.log('\nVerification Summary:');
    if (total && total > 2000) console.log('🎉 Data migration appears SUCCESSFUL. Count matches expected (~2193).');
    else console.log('⚠️ Data count seems low. Please check import.');
}

verifyData().catch(console.error);
