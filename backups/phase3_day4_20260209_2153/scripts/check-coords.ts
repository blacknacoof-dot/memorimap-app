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
            if (key) process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        });
    }
}
loadEnv();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');

async function checkCoordinates() {
    console.log("🔍 Analyzing Facility Coordinates...");

    // 1. Total Count
    const { count: total } = await supabase.from('memorial_spaces').select('*', { count: 'exact', head: true });

    // 2. Valid Coordinates (Non-zero, Not Null)
    // Supabase numeric check might be tricky with just .neq, let's fetch basic stats
    // We'll fetch all checks in batches if needed, but for count we can query.

    const { count: validLat } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .gt('lat', 30) // Korea is roughly 33-38
        .lt('lat', 40);

    const { count: zeroLat } = await supabase
        .from('memorial_spaces')
        .select('*', { count: 'exact', head: true })
        .or('lat.is.null,lat.eq.0');

    console.log(`📊 Coordinate Analysis:`);
    console.log(`   - Total Facilities: ${total}`);
    console.log(`   - Valid Lat (30-40): ${validLat} (${Math.round((validLat || 0) / (total || 1) * 100)}%)`);
    console.log(`   - Invalid/Zero Lat: ${zeroLat}`);

    if ((validLat || 0) < 100) {
        console.log("⚠️ MAJOR ISSUE: Most facilities do not have valid coordinates!");
        console.log("   They will NOT appear on the map.");
    } else {
        console.log("✅ Coordinates seem mostly valid. Issue might be frontend clustering.");
    }
}

checkCoordinates();
