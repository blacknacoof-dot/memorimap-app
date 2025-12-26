import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFacilityTypes() {
    console.log('🔄 Starting facility type correction...');

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, type');

    if (error) {
        console.error('❌ Error fetching facilities:', error);
        return;
    }

    console.log(`📊 Total facilities to check: ${facilities.length}`);

    let updatedCount = 0;

    for (const f of facilities) {
        let newType = f.type;
        const name = f.name;

        // Classification Logic -----------------------------------------
        // 1. Funeral Homes (장례식장)
        if (name.includes('장례식장') || name.includes('장례') || name.includes('병원')) {
            // Cases where it might be misclassified as something else
            if (f.type !== 'funeral') {
                newType = 'funeral';
            }
        }
        // 2. Memorial Parks (추모공원, 묘원, 공원묘지)
        else if (name.includes('추모공원') || name.includes('공원') || name.includes('묘원') || name.includes('메모리얼')) {
            if (f.type !== 'park' && f.type !== 'complex') {
                newType = 'park';
            }
        }
        // 3. Charnel Houses (납골당, 봉안당)
        else if (name.includes('납골') || name.includes('봉안')) {
            if (f.type !== 'charnel') {
                newType = 'charnel';
            }
        }
        // 4. Natural Burials (수목장, 자연장)
        else if (name.includes('수목장') || name.includes('자연장') || name.includes('숲')) {
            if (f.type !== 'natural') {
                newType = 'natural';
            }
        }
        // -------------------------------------------------------------

        // Update if changed
        if (newType !== f.type) {
            console.log(`🛠️ Fixing: [${name}] ${f.type} -> ${newType}`);
            const { error: updateError } = await supabase
                .from('memorial_spaces')
                .update({ type: newType })
                .eq('id', f.id);

            if (updateError) {
                console.error(`  ❌ Failed to update ${name}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log('✅ Correction Complete!');
    console.log(`📝 Updated ${updatedCount} facilities.`);
}

fixFacilityTypes();
