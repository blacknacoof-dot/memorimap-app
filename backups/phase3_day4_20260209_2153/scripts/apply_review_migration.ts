
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
}

import pg from 'pg';
const { Client } = pg;

async function run() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    try {
        const sql = fs.readFileSync(path.join(process.cwd(), 'scripts', 'migrate_review_approval.sql'), 'utf8');
        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.end();
    }
}

run();
