
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials missing (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Phase 0 & 1: Backup & Schema Update...\n');

    // 1. Backup
    const backupSql = `CREATE TABLE IF NOT EXISTS memorial_spaces_backup_20251223 AS SELECT * FROM memorial_spaces;`;

    // 2. Add parent_id
    const schemaSql = `ALTER TABLE memorial_spaces ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES memorial_spaces(id);`;

    try {
        console.log('📦 Backing up table...');
        const { error: backupError } = await supabase.rpc('exec_sql', { sql_query: backupSql });

        if (backupError) {
            // If exec_sql missing, we can't proceed easily.
            console.error('❌ Backup failed (exec_sql might be missing):', backupError);
            throw backupError;
        }
        console.log('✅ Backup complete: memorial_spaces_backup_20251223');

        console.log('🏗️  Adding parent_id column...');
        const { error: schemaError } = await supabase.rpc('exec_sql', { sql_query: schemaSql });

        if (schemaError) {
            console.error('❌ Schema update failed:', schemaError);
            throw schemaError;
        }
        console.log('✅ Schema update complete: parent_id added');

    } catch (err) {
        console.error('❌ Migration Failed:', err);
        console.log('\n💡 If `exec_sql` RPC is missing, please run the following SQL in Supabase Dashboard:');
        console.log(backupSql);
        console.log(schemaSql);
        process.exit(1);
    }
}

runMigration();
