
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

async function inspectStep1() {
    console.log('--- PostGIS Hardening: Step 1 Inspection ---');

    const sql1 = `
        SELECT n.nspname AS schema, c.relname AS object 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relkind IN ('r','v','m') 
        AND n.nspname = 'public' 
        AND c.relname IN ('spatial_ref_sys','geometry_columns','geography_columns');
    `;

    const sql2 = `
        SELECT extname, nspname 
        FROM pg_extension 
        JOIN pg_namespace ON pg_extension.extnamespace = pg_namespace.oid 
        WHERE extname = 'postgis';
    `;

    // Try both queries
    const res1 = await supabase.rpc('exec_sql', { sql_query: sql1 });
    const res2 = await supabase.rpc('exec_sql', { sql_query: sql2 });

    if (res1.error || res2.error) {
        console.log('Inspection via RPC failed. Please run these queries manually in SQL Editor:');
        console.log(sql1);
        console.log(sql2);
    } else {
        console.log('PostGIS Objects in public:', res1.data);
        console.log('PostGIS Extension Location:', res2.data);
    }
}

inspectStep1();
