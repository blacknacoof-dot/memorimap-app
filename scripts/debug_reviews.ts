import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("🔍 Debugging '부모사랑' reviews...");

    const { data: companies, error: fError } = await supabase
        .from('funeral_companies')
        .select('id, name, review_count')
        .ilike('name', '%부모사랑%');

    if (fError) {
        console.error("Error fetching companies:", fError);
        return;
    }

    console.log("Found Companies:", companies);

    if (companies && companies.length > 0) {
        for (const company of companies) {
            const { data: reviews, error: rError } = await supabase
                .from('reviews')
                .select('*')
                .eq('facility_id', company.id);

            if (rError) {
                console.error(`Error fetching reviews for ${company.id}:`, rError);
            } else {
                console.log(`Reviews in DB for ${company.name} (${company.id}):`, reviews?.length);
                if (reviews && reviews.length > 0) {
                    console.log("Sample Review:", JSON.stringify(reviews[0], null, 2));
                }
            }
        }
    }

    console.log("\n🔍 Checking ALL reviews count...");
    const { count, error: cError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

    console.log("Total Reviews in table:", count);
}

debug();
