
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Key');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function backupFacilities() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backups/facilities_backup_${timestamp}.json`;

    console.log(`--- 💾 Starting Backup to ${filename} ---`);

    const { data, error } = await supabase
        .from('facilities')
        .select('*');

    if (error) {
        console.error('❌ Backup failed:', error.message);
        return;
    }

    // Ensure backups dir exists
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const filePath = path.resolve(__dirname, `../${filename}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✅ Backup successful! Saved ${data.length} records.`);
    console.log(`📂 Path: ${filePath}`);
}

backupFacilities();
