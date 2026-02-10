
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

console.log("Checking for DATABASE_URL...");
if (process.env.DATABASE_URL) {
    console.log("✅ DATABASE_URL is present.");
} else {
    console.log("❌ DATABASE_URL is NOT present.");
}

console.log("Keys found:", Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL')));
