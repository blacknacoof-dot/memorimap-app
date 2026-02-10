const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnose() {
    console.log('--- Diagnosis Start ---');

    // funeral_companies 테이블의 프리드라이프 확인
    const { data: friedData, error: friedError } = await supabase
        .from('funeral_companies')
        .select('id, name')
        .ilike('name', '%프리드라이프%');

    if (friedError) {
        console.error('Error fetching Fried Life:', friedError);
    } else {
        console.log('🔍 funeral_companies 테이블의 프리드라이프:', JSON.stringify(friedData, null, 2));
    }

    // 모든 funeral_companies ID 확인 (일부)
    const { data: allCompanies, error: allError } = await supabase
        .from('funeral_companies')
        .select('id, name')
        .limit(10);

    if (allError) {
        console.error('Error fetching sample companies:', allError);
    } else {
        console.log('📊 funeral_companies ID 샘플:', JSON.stringify(allCompanies, null, 2));
    }

    // Also check facilities table for "프리드라이프" to see if it exists there with a UUID
    const { data: facilityData, error: facilityError } = await supabase
        .from('facilities')
        .select('id, name, type')
        .ilike('name', '%프리드라이프%');

    if (facilityError) {
        console.error('Error fetching facilities:', facilityError);
    } else {
        console.log('🏢 facilities 테이블의 프리드라이프:', JSON.stringify(facilityData, null, 2));
    }

    console.log('--- Diagnosis End ---');
}

diagnose();
