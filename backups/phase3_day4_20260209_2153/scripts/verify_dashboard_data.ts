
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Use Service Role if available to bypass RLS for verification, otherwise Anon
const supabase = createClient(supabaseUrl!, supabaseServiceKey || supabaseKey!);

async function verifyDashboardData() {
    console.log('--- Verifying Facility Admin Dashboard Data (Backend) ---\n');

    // 1. Get a sample facility that has a user assigned (Real Check)
    console.log('1. Fetching a facility with an assigned user...');

    // We check for facilities where user_id is NOT NULL
    const { data: facilities, error: fError } = await supabase
        .from('facilities')
        .select('id, name, user_id')
        .not('user_id', 'is', null)
        .limit(1);

    if (fError) {
        console.error('❌ Failed to fetch facilities:', fError);
        return;
    }

    if (!facilities || facilities.length === 0) {
        console.warn('⚠️ No facilities found with an assigned user (user_id is null for all).');
        console.warn('   This means no one can log in as a Facility Admin currently.');

        // Fallback: Just get any facility to test data loading
        console.log('   Fallback: Fetching ANY facility for data check...');
        const { data: anyFacilities } = await supabase.from('facilities').select('id, name').limit(1);
        if (anyFacilities && anyFacilities.length > 0) {
            checkFacilityData(anyFacilities[0]);
        } else {
            console.error('❌ No facilities found in DB at all.');
        }
        return;
    }

    const facility = facilities[0];
    console.log(`✅ Found Active Facility: ${facility.name} (${facility.id})`);
    console.log(`   Assigned User ID: ${facility.user_id}`);

    await checkFacilityData(facility);
}

async function checkFacilityData(facility: any) {
    // 2. Mocking logic: Fetch Reservations for this facility
    console.log('\n2. Fetching Reservations...');
    const { data: reservations, error: rError } = await supabase
        .from('reservations')
        .select('*')
        .eq('facility_id', facility.id)
        .limit(5);

    if (rError) {
        console.error('❌ Error fetching reservations:', rError);
    } else {
        console.log(`✅ Reservations found: ${reservations?.length || 0}`);
        if (reservations && reservations.length > 0) {
            console.log('   Sample Reservation Status:', reservations[0].status);
        } else {
            console.warn('   ℹ️ No reservations found. (Normal if new facility)');
        }
    }

    // 3. Mocking logic: Fetch Consultations for this facility
    console.log('\n3. Fetching Consultations...');
    const { data: consultations, error: cError } = await supabase
        .from('consultations')
        .select('*')
        .eq('facility_id', facility.id) // Assuming consultations uses facility_id (UUID or numeric?)
        // Note: Consultations table might verify facility_id differently if it's not UUID.
        // But queries.ts createConsultation uses facilityId directly.
        .limit(5);

    if (cError) {
        console.error('❌ Error fetching consultations:', cError);
    } else {
        console.log(`✅ Consultations found: ${consultations?.length || 0}`);
    }

    console.log('\n--- Facility Admin Verification Complete ---');
}

verifyDashboardData();
