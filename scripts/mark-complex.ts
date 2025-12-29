
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

// Multi-type facilities - update their type to 'complex' to indicate they offer multiple services
const MULTI_TYPE_FACILITIES = [
    { id: 5, name: '유토피아추모관', originalTypes: ['charnel', 'natural'] },
    { id: 18, name: '광주영락공원', originalTypes: ['complex', 'park'] },
    { id: 280, name: '자임추모공원', originalTypes: ['park', 'charnel'] },
    { id: 421, name: '화천공원묘원', originalTypes: ['park', 'charnel'] },
    { id: 490, name: '구례군공설자연장지', originalTypes: ['park', 'natural'] },
    { id: 568, name: '홍성추모공원봉안당', originalTypes: ['park', 'charnel'] },
    { id: 646, name: '신불산추모공원', originalTypes: ['charnel', 'natural'] },
];

async function markAsComplex() {
    console.log('Marking multi-type facilities as "complex"...\n');

    for (const facility of MULTI_TYPE_FACILITIES) {
        const { error } = await supabase
            .from('memorial_spaces')
            .update({ type: 'complex' })
            .eq('id', facility.id);

        if (error) {
            console.error(`Failed to update ID ${facility.id}:`, error.message);
        } else {
            console.log(`Updated "${facility.name}" (ID: ${facility.id}) to type: complex`);
        }
    }

    console.log('\nDone!');
}

markAsComplex();
