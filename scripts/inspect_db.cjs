
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or Key is missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
    console.log(`Inspecting table: ${tableName}...`);

    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);

    if (error) {
        console.error(`Error querying ${tableName}:`, error.message);
        return;
    }

    console.log(`Found ${data.length} rows.`);
    if (data.length > 0) {
        console.log('Sample data keys:', Object.keys(data[0]));
        console.log('Sample row:', data[0]);
    } else {
        console.log('Table is empty.');
    }
}

const tableName = process.argv[2];
if (!tableName) {
    console.log('Usage: node scripts/inspect_db.js <table_name>');
    process.exit(1);
}

inspectTable(tableName);
