
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Dynamic import to allow env vars to load
const verifySearch = async () => {
    const { supabase } = await import('../lib/supabaseClient');

    // const { searchFacilitiesV2 } = await import('../lib/queries'); 
    // Manual RPC call for simpler debugging script

    console.log('--- Starting Search Verification ---');
    console.log('Calling search_facilities_v2(37.5665, 126.9780)...');

    const { data, error } = await supabase.rpc('search_facilities_v2', {
        p_lat: 37.5665,
        p_lng: 126.9780,
        p_radius_meters: 50000,
        p_limit: 5
    });

    if (error) {
        console.error('❌ Search failed:', error);
        console.error('Please ensure you have executed the create_search_rpc.sql script in Supabase.');
        process.exit(1);
    }

    console.log('✅ Search successful!');
    console.log(`Found ${data?.length || 0} facilities.`);
    if (data && data.length > 0) {
        console.log('Sample result:', data[0]);
    } else {
        console.warn('⚠️ No facilities found. Check if the facilities table has data and location columns populated.');
    }
    console.log('--- Search Verification Passed ---');
};

verifySearch();
