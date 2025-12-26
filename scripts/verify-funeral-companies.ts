import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key) process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        });
    }
}
loadEnv();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function verify() {
    console.log("🔍 Verifying Funeral Companies Data...");

    const { count, error } = await supabase
        .from('funeral_companies')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("❌ error:", error);
        return;
    }

    console.log(`📊 Total Funeral Companies: ${count || 0}`);

    if (count && count > 0) {
        const { data: samples } = await supabase
            .from('funeral_companies')
            .select('id, name, rating, review_count')
            .limit(3);

        console.log("📍 Sample Items:");
        samples?.forEach(s => console.log(` - [${s.id}] ${s.name} (★${s.rating}, 💬${s.review_count})`));
    } else {
        console.log("⚠️ No data found in funeral_companies table.");
    }
}

verify();
