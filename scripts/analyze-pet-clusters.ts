
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeClusters() {
    console.log('🔍 Analyzing Pet Facility Coordinates...');

    // Fetch all pet facilities
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, lat, lng')
        .eq('type', 'pet');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log(`Examples found: ${facilities.length}`);

    // Group by coordinates
    const clusters: Record<string, typeof facilities> = {};

    facilities.forEach(f => {
        const key = `${f.lat},${f.lng}`;
        if (!clusters[key]) {
            clusters[key] = [];
        }
        clusters[key].push(f);
    });

    let duplicatesCount = 0;
    let geocodingErrorCount = 0;

    Object.entries(clusters).forEach(([key, group]) => {
        if (group.length > 1) {
            // Check if addresses are different
            const firstAddress = group[0].address;
            const isDifferentAddress = group.some(f => {
                // Simple check: significantly different length or non-overlapping content
                // For accurate check, we'd use Levenshtein, but here let's check if length diff > 5 or substring match fails
                return Math.abs(f.address.length - firstAddress.length) > 10 ||
                    (!f.address.includes(firstAddress.substring(0, 5)) && !firstAddress.includes(f.address.substring(0, 5)));
            });

            if (isDifferentAddress) {
                geocodingErrorCount++;
                console.log(`\n🚨 [Geocoding Error?] Coordinates ${key} shared by different addresses:`);
                group.forEach(f => console.log(`   - ${f.id}: ${f.name} (${f.address})`));
            } else {
                duplicatesCount++;
                console.log(`\n👯 [Duplicate?] Coordinates ${key} shared by similar addresses:`);
                group.forEach(f => console.log(`   - ${f.id}: ${f.name} (${f.address})`));
            }
        }
    });

    console.log(`\nSummary:`);
    console.log(`- Potential Duplicates: ${duplicatesCount} clusters`);
    console.log(`- Suspicious Geocoding: ${geocodingErrorCount} clusters`);
}

analyzeClusters();
