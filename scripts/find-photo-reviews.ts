
import { createClient } from '@supabase/supabase-js';
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase Credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findPhotoReviews() {
    console.log("🔍 Finding top 5 facilities with recent photo reviews...");

    // Find facilities that have reviews and images
    // Note: photos column in facility_reviews or facility_images table
    const { data, error } = await supabase
        .from('facility_reviews')
        .select('facility_id, author_name, content, photos, created_at, memorial_spaces(name)')
        .not('photos', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching reviews:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No reviews with photos found. Checking facility_images join...");

        const { data: imgData, error: imgError } = await supabase
            .from('facility_images')
            .select('facility_id, memorial_spaces(name)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (imgError) {
            console.error("Error fetching images:", imgError);
            return;
        }

        const uniqueFacilities = new Map();
        imgData.forEach((item: any) => {
            if (!uniqueFacilities.has(item.facility_id)) {
                uniqueFacilities.set(item.facility_id, item.memorial_spaces?.name || 'Unknown');
            }
        });

        console.log("--- Facilities with Recent Photos ---");
        Array.from(uniqueFacilities.entries()).slice(0, 5).forEach(([id, name]) => {
            console.log(`- ${name} (ID: ${id})`);
        });
    } else {
        console.log("--- Top 5 Recent Photo Reviews ---");
        const seen = new Set();
        let count = 0;
        for (const r of data) {
            if (count >= 5) break;
            const name = (r as any).memorial_spaces?.name || 'Unknown';
            if (!seen.has(name)) {
                console.log(`- ${name} (Author: ${r.author_name}, Date: ${r.created_at})`);
                seen.add(name);
                count++;
            }
        }
    }
}

findPhotoReviews();
