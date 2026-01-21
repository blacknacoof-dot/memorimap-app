
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_COMPANIES = ['웰리빙라이프', '한강라이프', '우리관광'];

async function deleteCompanies() {
    console.log(`🔍 Starting deletion for: ${TARGET_COMPANIES.join(', ')}`);

    const { data, error } = await supabase
        .from('funeral_companies')
        .delete()
        .in('name', TARGET_COMPANIES)
        .select();

    if (error) {
        console.error('❌ Error deleting companies:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`✅ Successfully deleted ${data.length} companies:`);
        data.forEach((company: any) => {
            console.log(`   - ${company.name} (ID: ${company.id})`);
        });
    } else {
        console.log('⚠️ No matching companies found to delete.');
    }
}

deleteCompanies();
