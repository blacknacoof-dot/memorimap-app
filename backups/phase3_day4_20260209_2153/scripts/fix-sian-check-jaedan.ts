
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function work() {
    console.log('=== 1. Fix Sian ===');

    // Revert incorrect update to ID 774 (assuming it had no photos before, or just clear them)
    // Actually I should check what it had, but likely null/empty. Set to null.
    await supabase.from('memorial_spaces').update({ image_url: null, gallery_images: null }).eq('id', 774);
    console.log('Reverted ID 774 (동두천시안흥동...) photos to null.');

    // Find real 시안가족추모공원
    // User image says: "시안 가족추모공원", "경기도 광주시 오포안로 17"
    const { data: realSian, error: sErr } = await supabase
        .from('memorial_spaces')
        .select('id, name, address')
        .ilike('address', '%오포안로 17%');

    if (realSian && realSian.length > 0) {
        const target = realSian[0];
        console.log(`Found Real Sian: [${target.id}] ${target.name} (${target.address})`);

        // Update photos
        const urls = ['/images/facilities/sian/sian_1.jpg', '/images/facilities/sian/sian_2.jpg', '/images/facilities/sian/sian_3.jpg'];
        await supabase.from('memorial_spaces')
            .update({ image_url: urls[0], gallery_images: urls })
            .eq('id', target.id);
        console.log(`Updated Sian (ID ${target.id}) with ${urls.length} photos.`);
    } else {
        console.log('❌ Could not find "시안가족추모공원" with address "오포안로 17". Trying broad check...');
        // Broad check
        const { data: broadSian } = await supabase.from('memorial_spaces').select('id, name, address').ilike('name', '%시안%가족%');
        console.log('Broad Sian Search:', JSON.stringify(broadSian, null, 2));
    }

    console.log('\n=== 2. Check remaining 재단법인 ===');
    const { data: jaedan } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .ilike('name', '%재단법인%');

    if (jaedan && jaedan.length > 0) {
        console.log(`Checking ${jaedan.length} "재단법인" entries for duplicates...`);
        for (const f of jaedan) {
            const cleanName = f.name.replace(/재단법인\s*/g, '').replace(/\(재\)\s*/g, '').trim();
            const { data: matches } = await supabase
                .from('memorial_spaces')
                .select('id, name, address')
                .ilike('name', cleanName) // EXACT match on clean name sometimes works better, or ilike
                .neq('id', f.id);

            if (matches && matches.length > 0) {
                console.log(`\nPotential Duplicate for [${f.id}] ${f.name}:`);
                matches.forEach(m => console.log(`  - [${m.id}] ${m.name} (${m.address})`));
            }
        }
    } else {
        console.log('No "재단법인" entries found.');
    }
}

work();
