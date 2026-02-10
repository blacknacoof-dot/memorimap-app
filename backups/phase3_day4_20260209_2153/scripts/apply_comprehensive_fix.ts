import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error("❌ No DATABASE_URL found in .env.local");
    process.exit(1);
}

async function run() {
    console.log("🔌 Connecting to Database for comprehensive fix...");
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected!");

        const sql = fs.readFileSync(path.resolve(process.cwd(), 'scripts/fix_reviews_comprehensive.sql'), 'utf-8');
        console.log("🛠️ Applying comprehensive reviews fix...");
        await client.query(sql);
        console.log("✅ Comprehensive fix applied!");

    } catch (err) {
        console.error("❌ Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
