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

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');

async function checkData() {
    console.log("🔍 Checking Database...");

    // 1. Count
    const { count, error } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true });

    if (error) console.error("Count Error:", error);
    console.log(`📊 Total Memorial Spaces: ${count}`);

    // 2. Sample Check
    const { data, error: fetchError } = await supabase
        .from('memorial_spaces')
        .select('name, review_count, gallery_images, reviews')
        .limit(3);

    if (fetchError) console.error("Fetch Error:", fetchError);
    if (data) {
        console.log("📝 Sample Data:");
        data.forEach((d, i) => {
            console.log(`[${i}] ${d.name}: Reviews=${d.review_count}, Photos=${d.gallery_images?.length}, Reviews Array=${d.reviews?.length}`);
        });
    }
}

checkData();
