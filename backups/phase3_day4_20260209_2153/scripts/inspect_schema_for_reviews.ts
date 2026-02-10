
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("🕵️  Inspecting Schema...");

    // 1. Check Reviews Table columns
    const { data: reviews, error: rError } = await supabase.from('reviews').select('*').limit(1);
    console.log("Reviews Sample:", reviews?.[0] ? Object.keys(reviews[0]) : "Empty or Error");

    // 2. Check Consultations/Contracts
    // We want to know what table holds "Contract Applications"
    // Trying 'consultations' first
    const { data: consults, error: cError } = await supabase.from('consultations').select('*').limit(1);
    console.log("Consultations Sample:", consults?.[0] ? Object.keys(consults[0]) : "Empty or Error");

    // Trying 'sangjo_contracts' (inferred from types)
    const { data: contracts, error: kError } = await supabase.from('sangjo_contracts').select('*').limit(1);
    if (kError) console.log("sangjo_contracts table likely does not exist:", kError.message);
    else console.log("Sangjo Contracts Sample:", contracts?.[0] ? Object.keys(contracts[0]) : "Empty or Error");

    // Check 'leads' just in case
    const { data: leads } = await supabase.from('leads').select('*').limit(1);
    console.log("Leads Sample:", leads?.[0] ? Object.keys(leads[0]) : "Empty or Error");
}

inspect();
