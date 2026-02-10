
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceFix() {
    console.log("🕵️  Force fixing Preed Life reviews to Full Names...");

    const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('space_id', '1014'); // Preed Life ID

    if (reviews && reviews.length > 0) {
        const names = ['장민수', '윤서연', '이준호', '김지아', '정우성'];

        for (let i = 0; i < reviews.length; i++) {
            const review = reviews[i];
            const newName = names[i % names.length];

            const { error: updateError } = await supabase
                .from('reviews')
                .update({ user_name: newName }) // Set to '장민수'
                .eq('id', review.id);

            if (updateError) console.error(`Failed to update ${review.id}`);
            else console.log(`Updated ${review.id}: ${review.user_name} -> ${newName}`);
        }
    }
}

forceFix();
