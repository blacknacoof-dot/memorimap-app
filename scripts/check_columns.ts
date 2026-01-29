import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const tables = [
        'broken_images_backup_20260119',
        'columbarium_backup_20260119',
        'facilities_backup_20260119',
        'facilities_backup_20260122',
        'facility_subscriptions_backup',
        'funeral_company_legacy_mapping',
        'sangjo_hq_admins'
    ];

    for (const table of tables) {
        const { data, error } = await supabase
            .from('information_schema_columns') // This won't work directly via .from() because it's a different schema
            .select('column_name, data_type')
            .eq('table_name', table)
            .eq('table_schema', 'public');

        // Actually, I'll use the execute_sql RPC since it's cleaner for raw queries if it exists,
        // but PGRST202 earlier showed it might not be available or named differently.
        // Wait, earlier I found that execute_sql was NOT found.

        // I will try to fetch one row from each table to see columns if I can't query information_schema.
        const { data: row, error: rowError } = await supabase.from(table).select('*').limit(1);

        if (rowError) {
            console.log(`Table ${table} Error:`, rowError.message);
        } else {
            console.log(`Table ${table} Columns:`, Object.keys(row[0] || {}).join(', '));
        }
    }
}

main();
