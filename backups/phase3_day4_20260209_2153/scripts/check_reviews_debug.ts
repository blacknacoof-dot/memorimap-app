
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // or service key if needed

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviews() {
    console.log('=== Checking facility_reviews Table ===');

    const { data: reviews, error } = await supabase
        .from('facility_reviews')
        .select('*')
        .limit(10);

    if (error) {
        console.error('Error fetching reviews:', error);
        return;
    }

    console.log(`Found ${reviews.length} reviews (limit 10)`);
    reviews.forEach(r => {
        console.log(`- ID: ${r.id}, Facility: [${r.facility_id}], User: ${r.user_id}, Active: ${r.is_active}`);
    });

    console.log('\n=== Checking specifically for fc1 ===');
    const { data: fc1Reviews, error: fc1Error } = await supabase
        .from('facility_reviews')
        .select('*')
        .eq('facility_id', 'fc1');

    if (fc1Error) {
        console.error('Error fetching fc1 reviews:', fc1Error);
    } else {
        console.log(`Found ${fc1Reviews.length} reviews for facility_id "fc1"`);
        fc1Reviews.forEach(r => {
            console.log(`- ID: ${r.id}, User: ${r.user_id}, Content: ${r.content?.substring(0, 20)}...`);
        });
    }

    console.log('\n=== Checking funeral_companies Table ===');
    const { data: companies, error: compError } = await supabase
        .from('funeral_companies')
        .select('id, name');

    if (compError) {
        console.error('Error fetching companies:', compError);
    } else {
        console.log(`Found ${companies.length} companies`);
        companies.forEach(c => {
            console.log(`- ID: [${c.id}], Name: ${c.name}`);
        });
    }
}

checkReviews();
