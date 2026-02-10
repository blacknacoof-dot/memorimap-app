
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Fallback

const { Client } = pg;

// Try to find the connection string
// VITE_SUPABASE_URL is URL, key is Key. 
// We need the direct postgres connection string (e.g. postgres://postgres:password@db.supabase.co:5432/postgres)
// Usually stored as DATABASE_URL or DIRECT_URL in .env
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

async function applyMigration() {
    console.log('--- Applying Security Migration ---');

    if (!connectionString) {
        console.warn('⚠️ No DATABASE_URL or DIRECT_URL found in .env files.');
        console.warn('   Cannot automatically apply migration. Please run the SQL file manually.');
        return;
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();

        console.log('✅ Connected to Database.');

        const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260204_security_hardening.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running SQL...');
        await client.query(sql);
        console.log('✅ Migration executed successfully!');

    } catch (err: any) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        await client.end();
    }
}

applyMigration();
