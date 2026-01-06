const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    console.log("🔍 Verifying 'facilities' table migration...");
    const { count, error } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("❌ Error accessing table:", error.message);
    } else {
        console.log(`✅ Total Rows in 'facilities': ${count}`);
    }
}

verify();
