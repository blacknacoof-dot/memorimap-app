
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

interface Facility {
    id: any;
    name: string;
    address: string;
    type: string;
    lat: number;
    lng: number;
    is_verified: boolean;
    data_source: string;
    review_count: number;
}

async function findDuplicates() {
    console.log("🔍 Starting Full Duplicate Scan (Coordinates & Address)...\n");

    // Fetch all facilities using pagination
    let facilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type, lat, lng, is_verified, data_source, review_count')
            .order('id')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("❌ Failed to fetch facilities:", error);
            return;
        }

        if (!data || data.length === 0) break;

        facilities = facilities.concat(data);

        if (data.length < pageSize) break;
        page++;
    }

    if (!facilities || facilities.length === 0) {
        console.log("No facilities found.");
        return;
    }

    console.log(`📊 Analyzed ${facilities.length} facilities.`);

    // 1. Group by Exact Coordinates
    const coordMap = new Map<string, Facility[]>();
    // 2. Group by Normalized Address
    const addrMap = new Map<string, Facility[]>();

    facilities.forEach(f => {
        // Coord Key: lat,lng (to 6 decimal places for 'exact' match)
        if (f.lat && f.lng) {
            const coordKey = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}`;
            if (!coordMap.has(coordKey)) coordMap.set(coordKey, []);
            coordMap.get(coordKey)?.push(f);
        }

        // Address Key: remove spaces
        if (f.address) {
            const addrKey = f.address.replace(/\s+/g, '').trim();
            if (!addrMap.has(addrKey)) addrMap.set(addrKey, []);
            addrMap.get(addrKey)?.push(f);
        }
    });

    // Collect Duplicates
    const duplicates = new Map<string, Facility[]>(); // Key: some unique ID for the cluster

    // Process Coordinates
    for (const [key, list] of coordMap.entries()) {
        if (list.length > 1) {
            // Filter out exact same ID (shouldn't happen if DB is unique id, but just in case)
            // Filter out same Name (if name is identical, it's a pure duplicate)
            const clusterKey = `COORD:${key}`;
            duplicates.set(clusterKey, list);
        }
    }

    // Process Address (merge into duplicates map if not already covered? or just separate list)
    // Let's just create a list of reports.

    let reportMarkdown = "# 🚩 Suspected Duplicate Facilities Report\n\n";
    reportMarkdown += `Generated at: ${new Date().toLocaleString()}\n\n`;

    let count = 0;

    // Report Coordinate Duplicates
    reportMarkdown += "## 📍 Exact Location Matches (Same Lat/Lng)\n\n";
    for (const [key, list] of coordMap.entries()) {
        if (list.length > 1) {
            // Check if names are distinct
            const names = new Set(list.map(f => f.name));
            // If Names are distinct, it might be floors in same building. 
            // If Names are identical, it is definitely a duplicate.

            reportMarkdown += `### Cluster ${++count} (Loc: ${key})\n`;
            reportMarkdown += `- **Address**: ${list[0].address}\n`;

            list.forEach(f => {
                const mark = f.is_verified ? "✅ Verified" : "⬜";
                const source = f.data_source || 'unknown';
                reportMarkdown += `  - **${f.name}** (${f.type}) | ID: \`${f.id}\` | ${mark} | Source: ${source} | Reviews: ${f.review_count}\n`;
            });
            reportMarkdown += "\n";
        }
    }

    // Report Address Duplicates (that were not caught byCoords?)
    // Actually, usually same coord implies same address, but verify.
    // We can list Address Matches separately if they have DIFFERENT coordinates.

    reportMarkdown += "## 🏠 Same Address Matches (Different Coordinates)\n\n";
    let addrCount = 0;
    for (const [key, list] of addrMap.entries()) {
        if (list.length > 1) {
            // Check if this cluster was already reported in Coord Map?
            // Heuristic: If all items in this list have same Lat/Lng, we probably listed it above.
            // If they have different Lat/Lngs, it's a "Same Address but Scattered Pins" issue.

            const lats = new Set(list.map(f => Number(f.lat).toFixed(6)));
            const lngs = new Set(list.map(f => Number(f.lng).toFixed(6)));

            if (lats.size === 1 && lngs.size === 1) {
                // Already likely covered in Coord section
                continue;
            }

            reportMarkdown += `### Address Cluster ${++addrCount} (Addr: ${list[0].address})\n`;
            list.forEach(f => {
                const mark = f.is_verified ? "✅ Verified" : "⬜";
                reportMarkdown += `  - **${f.name}** | Loc: ${f.lat}, ${f.lng} | ID: \`${f.id}\` | ${mark}\n`;
            });
            reportMarkdown += "\n";
        }
    }

    // Write Report
    fs.writeFileSync('duplicates_report.md', reportMarkdown, 'utf8');
    console.log(`\n✅ Report generated: duplicates_report.md`);
    if (count > 0 || addrCount > 0) {
        console.log(`⚠️  Found ${count} location clusters and ${addrCount} address clusters.`);
    } else {
        console.log("✨ No duplicates found!");
    }
}

findDuplicates();
