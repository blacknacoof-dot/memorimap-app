import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Manually load .env or .env.local
let envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    envPath = path.resolve(process.cwd(), '.env.local');
}

if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDaejeon() {
    console.log('--- Checking Daejeon Data ---');

    // 1. Direct Text Search (Simulate RPC)
    const searchText = '%대전%동구%';
    const { data: directData, error: directError } = await supabase
        .from('facilities')
        .select('id, name, address, category')
        .ilike('address', searchText)
        .limit(5);

    if (directError) console.error('Direct ILIKE Error:', directError);
    else {
        console.log(`Direct ILIKE '%대전%동구%' Found: ${directData?.length}`);
        console.log(directData);
    }

    // 2. Sample Daejeon Addresses
    const { data: sampleData } = await supabase
        .from('facilities')
        .select('id, name, address')
        .ilike('address', '%대전%')
        .limit(3);

    console.log('Sample Authenticated Query for Daejeon:', sampleData);

    // 3. Test RPC Call (The Fix Verification)
    console.log('--- Testing RPC search_facilities_by_text ---');
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('search_facilities_by_text', { p_text: '대전' });

    if (rpcError) console.error('RPC Error:', rpcError);
    else {
        console.log(`RPC '대전' Search Found: ${rpcData?.length}`);
        if (rpcData && rpcData.length > 0) {
            console.log('RPC Sample:', rpcData.slice(0, 2));
        } else {
            console.log('RPC returned empty array. Check if logic matches data.');
        }
    }
}

checkDaejeon();
