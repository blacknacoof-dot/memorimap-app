
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectPostGIS() {
    console.log('--- PostGIS Extension & Table Audit ---');

    const sql = `
        -- Check extension schema
        SELECT n.nspname as schema_name, e.extname as extension_name
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE e.extname = 'postgis';

        -- Check spatial_ref_sys ownership and schema
        SELECT n.nspname as schema_name, t.relname as table_name, r.rolname as owner_name
        FROM pg_class t
        JOIN pg_namespace n ON t.relnamespace = n.oid
        JOIN pg_roles r ON t.relowner = r.oid
        WHERE t.relname = 'spatial_ref_sys';

        -- Check available schemas
        SELECT nspname FROM pg_namespace WHERE nspname IN ('public', 'extensions', 'postgis');
    `;

    // Using the previously discovered fact that exec_sql might be missing, 
    // but just in case, or we use a more standard query if possible via PostgREST
    // However, these metadata tables are often not exposed via PostgREST.
    // We'll try exec_sql first.

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Audit failed (exec_sql unavailable or permission denied):', error);
        console.log('Falling back to direct table checks if possible...');
    } else {
        console.log('Audit Results:', data);
    }
}

inspectPostGIS();
