
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

// Multi-type facilities - these have duplicate entries with different types
// We'll add secondary_types to the primary record and delete the duplicate
const MULTI_TYPE_FACILITIES = [
    { keep: 5, delete: 907, secondaryTypes: ['natural'] },      // 유토피아추모관: charnel + natural
    { keep: 18, delete: 317, secondaryTypes: ['park'] },        // 광주영락공원: complex + park
    { keep: 280, delete: 661, secondaryTypes: ['charnel'] },    // 자임추모공원: park + charnel
    { keep: 421, delete: 823, secondaryTypes: ['charnel'] },    // 화천공원묘원: park + charnel
    { keep: 490, delete: 945, secondaryTypes: ['natural'] },    // 구례군공설자연장지: park + natural
    { keep: 568, delete: 676, secondaryTypes: ['charnel'] },    // 홍성추모공원봉안당: park + charnel
    { keep: 646, delete: 908, secondaryTypes: ['natural'] },    // 신불산추모공원: charnel + natural
];

async function consolidateMultiType() {
    console.log('Consolidating multi-type facilities...\n');

    for (const facility of MULTI_TYPE_FACILITIES) {
        // Update the primary record with secondary_types
        const { error: updateErr } = await supabase
            .from('memorial_spaces')
            .update({ secondary_types: facility.secondaryTypes })
            .eq('id', facility.keep);

        if (updateErr) {
            console.error(`Failed to update ID ${facility.keep}:`, updateErr.message);
            // If column doesn't exist, we need to add it first
            if (updateErr.message.includes('column')) {
                console.log('secondary_types column might not exist. Skipping update, only deleting duplicate.');
            }
        } else {
            console.log(`Updated ID ${facility.keep} with secondary_types: ${facility.secondaryTypes}`);
        }

        // Delete the duplicate
        const { error: delErr } = await supabase
            .from('memorial_spaces')
            .delete()
            .eq('id', facility.delete);

        if (delErr) {
            console.error(`Failed to delete ID ${facility.delete}:`, delErr.message);
        } else {
            console.log(`Deleted duplicate ID ${facility.delete}`);
        }
        console.log('---');
    }

    console.log('\nDone!');
}

consolidateMultiType();
