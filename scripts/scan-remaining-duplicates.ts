
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function scanRemaining() {
    console.log("🔍 Scanning for Remaining Duplicates (Location OR Name)...\n");

    let allFacilities: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type, lat, lng, parent_id, is_verified')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    // 1. Location Clusters
    const locMap = new Map<string, any[]>();
    allFacilities.forEach(f => {
        if (!f.lat || !f.lng) return;
        const key = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}`;
        if (!locMap.has(key)) locMap.set(key, []);
        locMap.get(key)?.push(f);
    });

    const locClusters = Array.from(locMap.entries())
        .filter(([_, list]) => list.length >= 2)
        .sort((a, b) => b[1].length - a[1].length);

    // 2. Name Clusters
    // Filter out common generic names if needed, but for now list all.
    const nameMap = new Map<string, any[]>();
    allFacilities.forEach(f => {
        const key = f.name.trim(); // Case sensitive? User said "Same Sangho".
        if (!nameMap.has(key)) nameMap.set(key, []);
        nameMap.get(key)?.push(f);
    });

    const nameClusters = Array.from(nameMap.entries())
        .filter(([_, list]) => list.length >= 2)
        .sort((a, b) => b[1].length - a[1].length);

    // Generate Report
    let report = "# 📋 Remaining Duplicates/Clusters Report\n\n";
    report += `Generated at: ${new Date().toLocaleString()}\n`;
    report += `Total Facilities Scanned: ${allFacilities.length}\n`;
    report += `\n---\n`;

    report += `## 📍 Same Location Clusters (${locClusters.length} groups)\n`;
    report += `> Items at the EXACT same coordinates (Lat/Lng).\n\n`;

    locClusters.forEach(([loc, list], idx) => {
        report += `### Loc Group ${idx + 1}: ${loc} (${list.length} Make)\n`;
        list.forEach(f => {
            const isChild = f.parent_id ? ` (Child of ${f.parent_id})` : '';
            report += `- [${f.id}] **${f.name}** (${f.type}) ${isChild}\n  Address: ${f.address}\n`;
        });
        report += `\n`;
    });

    report += `\n---\n`;
    report += `## 🏷️ Same Name Clusters (${nameClusters.length} groups)\n`;
    report += `> Items with EXACTLY the same name (globally).\n\n`;

    nameClusters.forEach(([name, list], idx) => {
        report += `### Name Group ${idx + 1}: "${name}" (${list.length} Items)\n`;
        list.forEach(f => {
            report += `- [${f.id}] **${f.name}** (${f.type}) | Loc: ${Number(f.lat).toFixed(4)},${Number(f.lng).toFixed(4)}\n  Address: ${f.address}\n`;
        });
        report += `\n`;
    });

    fs.writeFileSync('remaining_duplicates_report.md', report, 'utf8');
    console.log(`✅ Report generated: remaining_duplicates_report.md`);
    console.log(`   - Location Clusters: ${locClusters.length}`);
    console.log(`   - Name Clusters: ${nameClusters.length}`);
}

scanRemaining();
