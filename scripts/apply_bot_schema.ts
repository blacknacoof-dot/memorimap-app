import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Try multiple env var names for connection string
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error("❌ No DATABASE_URL found in .env.local");
    process.exit(1);
}

async function run() {
    console.log("🔌 Connecting to Database...");
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Connected!");

        console.log("🛠️ Creating bot_data table and applying RLS...");
        const sql = fs.readFileSync(path.resolve(process.cwd(), 'scripts/create_bot_data_table.sql'), 'utf-8');
        await client.query(sql);
        console.log("✅ bot_data table created and RLS applied.");

    } catch (err) {
        console.error("❌ Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
