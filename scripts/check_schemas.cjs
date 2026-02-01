const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
    console.log('--- Schema Check Start ---');

    // Check one record from funeral_companies
    const { data: fcSample, error: fcError } = await supabase
        .from('funeral_companies')
        .select('*')
        .limit(1);

    if (fcError) {
        console.error('Error fetching fc sample:', fcError);
    } else {
        console.log('📄 funeral_companies columns:', Object.keys(fcSample[0]));
        console.log('📄 funeral_companies sample record:', JSON.stringify(fcSample[0], null, 2));
    }

    // Check one record from facilities (type='상조')
    const { data: facSample, error: facError } = await supabase
        .from('facilities')
        .select('*')
        .eq('type', '상조')
        .limit(1);

    if (facError) {
        console.error('Error fetching facility sample:', facError);
    } else {
        if (facSample && facSample.length > 0) {
            console.log('🏢 facilities columns:', Object.keys(facSample[0]));
            console.log('🏢 facilities sample record:', JSON.stringify(facSample[0], null, 2));
        } else {
            console.log('🏢 No facilities with type="상조" found.');
        }
    }

    console.log('--- Schema Check End ---');
}

checkSchema();
