
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// --- Environment Setup ---
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (value) process.env[key.trim()] = value;
            }
        });
    }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkCounts() {
    console.log("📊 Checking Facility Type Counts...");

    const { data, error } = await supabase
        .from('memorial_spaces')
        .select('type');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const counts: Record<string, number> = {};
    data.forEach((row: any) => {
        const t = row.type || 'unknown';
        counts[t] = (counts[t] || 0) + 1;
    });

    console.log("--- Counts by Type ---");
    console.table(counts);
}

checkCounts();
