
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Credentials missing.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkApi() {
    console.log("🚦 Checking Data Access (API Replacement)...");

    // 1. Consultations Check
    console.log("\n1️⃣  Checking 'ai_consultations'...");
    const { data: consultations, error: cError } = await supabase
        .from('ai_consultations')
        .select('id')
        .limit(1);

    if (cError) {
        if (cError.code === '42P01') {
            console.error("   ❌ Table 'ai_consultations' does not exist.");
        } else {
            console.error(`   ❌ Error: ${cError.message}`);
        }
    } else {
        console.log(`   ✅ Connection Successful. Rows found: ${consultations?.length ?? 0}`);
    }

    // 2. Orders (Reservations) Check
    console.log("\n2️⃣  Checking 'reservations' (Orders)...");
    const { data: reservations, error: rError } = await supabase
        .from('reservations')
        .select('id')
        .limit(1);

    if (rError) {
        if (rError.code === '42P01') {
            console.error("   ❌ Table 'reservations' does not exist.");
        } else {
            console.error(`   ❌ Error: ${rError.message}`);
        }
    } else {
        console.log(`   ✅ Connection Successful. Rows found: ${reservations?.length ?? 0}`);
    }
}

checkApi();
