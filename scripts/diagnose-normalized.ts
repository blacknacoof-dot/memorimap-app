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

async function diagnose() {
    console.log("🔍 Diagnosing Normalized Data...");

    // 1. Check memorial_spaces
    const { data: spaces, error: spaceError } = await supabase
        .from('memorial_spaces')
        .select('id, name')
        .limit(5);

    if (spaceError) {
        console.error("❌ spaceError:", spaceError);
        return;
    }

    console.log("📍 Memorial Spaces (First 5):");
    spaces?.forEach(s => console.log(` - [${typeof s.id}] ${s.id}: ${s.name}`));

    // 2. Check facility_reviews
    const { count: reviewCount, error: reviewError } = await supabase
        .from('facility_reviews')
        .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total Facility Reviews: ${reviewCount || 0}`);
    if (reviewError) console.error("❌ reviewError:", reviewError);

    // 3. Check facility_images
    const { count: imageCount, error: imageError } = await supabase
        .from('facility_images')
        .select('*', { count: 'exact', head: true });

    console.log(`📊 Total Facility Images: ${imageCount || 0}`);
    if (imageError) console.error("❌ imageError:", imageError);

    // 4. Sample check for specific facility
    if (spaces && spaces.length > 0) {
        const targetId = spaces[0].id;
        console.log(`\n🔎 Deep dive into facility ID: ${targetId} (${spaces[0].name})`);

        const { data: rDetail } = await supabase.from('facility_reviews').select('*').eq('facility_id', targetId);
        console.log(` - Reviews found: ${rDetail?.length || 0}`);

        const { data: iDetail } = await supabase.from('facility_images').select('*').eq('facility_id', targetId);
        console.log(` - Images found: ${iDetail?.length || 0}`);

        if (iDetail && iDetail.length > 0) {
            console.log("   Sample Image URL:", iDetail[0].image_url);
        }
    }
}

diagnose();
