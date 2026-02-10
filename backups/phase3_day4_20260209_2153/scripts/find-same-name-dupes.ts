
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

interface Facility {
    id: number;
    name: string;
    address: string;
    type: string;
    lat: number;
    lng: number;
    parent_id?: number | null;
    is_verified: boolean;
    data_source: string;
}

async function findSameNameDupes() {
    console.log("🔍 Scanning for Same Location & Same Name Duplicates...\n");

    // Fetch All
    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type, lat, lng, parent_id, is_verified, data_source')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    const coordMap = new Map<string, Facility[]>();
    allFacilities.forEach(f => {
        if (!f.lat || !f.lng) return;
        const key = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}`;
        if (!coordMap.has(key)) coordMap.set(key, []);
        coordMap.get(key)?.push(f);
    });

    const candidates: Facility[][] = [];

    for (const [key, list] of coordMap.entries()) {
        if (list.length < 2) continue;

        // Group by Normalized Name within Location Cluster
        const nameMap = new Map<string, Facility[]>();

        list.forEach(f => {
            const normName = f.name.replace(/\s+/g, '').trim();
            // Also ignore simple type suffixes if needed? User said "Same Sangho". 
            // "SkyPark" vs "SkyPark" -> Match.
            // "SkyPark" vs "SkyParkFuneral" -> Mismatch.

            if (!nameMap.has(normName)) nameMap.set(normName, []);
            nameMap.get(normName)?.push(f);
        });

        for (const [nKey, group] of nameMap.entries()) {
            if (group.length > 1) {
                candidates.push(group);
            }
        }
    }

    // Report
    let report = "# 👯 Same Name & Location Duplicates Report\n\n";
    report += `Generated at: ${new Date().toLocaleString()}\n`;
    report += `Found ${candidates.length} candidate groups.\n\n`;

    candidates.forEach((group, idx) => {
        report += `### Group ${idx + 1} (Name: "${group[0].name}")\n`;
        group.forEach(f => {
            report += `- [${f.id}] **${f.name}** (${f.type}) | Ver: ${f.is_verified} | Src: ${f.data_source} | Parent: ${f.parent_id || 'None'}\n`;
        });
        report += `\n---\n`;
    });

    fs.writeFileSync('same_name_report.md', report, 'utf8');
    console.log(`✅ Report generated: same_name_report.md (${candidates.length} groups)`);
}

findSameNameDupes();
