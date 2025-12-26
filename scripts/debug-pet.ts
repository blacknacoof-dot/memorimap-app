
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkPetData() {
    console.log("🔍 Inspecting Pet Facilities...");

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, lat, lng, image_url, description')
        .eq('type', 'pet');

    if (error) {
        console.error("Error fetching:", error);
        return;
    }

    console.log(`Found ${data.length} pet facilities.`);

    // Check for coordinate duplicates
    const coordMap = new Map<string, number>();
    const missingPhotos = data.filter(d => !d.image_url).length;

    data.forEach(d => {
        const key = `${d.lat},${d.lng}`;
        coordMap.set(key, (coordMap.get(key) || 0) + 1);
    });

    console.log(`\n📊 Analysis:`);
    console.log(`- Total: ${data.length}`);
    console.log(`- Missing Photos: ${missingPhotos}`);
    console.log(`- Unique Coordinates: ${coordMap.size}`);

    console.log(`\n📍 Suspicious Clusters (Count > 2):`);
    for (const [coord, count] of coordMap.entries()) {
        if (count > 2) {
            console.log(`  - [${coord}]: ${count} facilities`);
            // List names at this coord
            const names = data.filter(d => `${d.lat},${d.lng}` === coord).map(d => d.name).join(', ');
            console.log(`    Names: ${names}`);
        }
    }

    // Show a few samples
    console.log(`\n📝 Sample Records:`);
    data.slice(0, 5).forEach(d => {
        console.log(`- [${d.name}] Addr: ${d.address}, Loc: ${d.lat},${d.lng}, Img: ${d.image_url ? 'Yes' : 'No'}`);
    });
}

checkPetData();
