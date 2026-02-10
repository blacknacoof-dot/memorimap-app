
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
        ssl: { rejectUnauthorized: false } // Supabase requires SSL, usually self-signed is ok for pooler
    });

    try {
        await client.connect();
        console.log("✅ Connected!");

        // 1. Run RLS Fix
        console.log("🛠️ Applying RLS Fixes...");
        const rlsSql = fs.readFileSync(path.resolve(process.cwd(), 'scripts/fix_reviews_rls.sql'), 'utf-8');
        await client.query(rlsSql);
        console.log("✅ RLS Fixes Applied.");

        // 2. Run Randomization
        console.log("🎲 Randomizing Reviews (Names)...");
        const randSql = fs.readFileSync(path.resolve(process.cwd(), 'scripts/randomize_review_ratings.sql'), 'utf-8');
        await client.query(randSql);
        console.log("✅ Reviews Randomized.");

    } catch (err) {
        console.error("❌ Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
