
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Facility {
    id: number;
    name: string;
    address: string;
    type: string;
    lat: number;
    lng: number;
    parent_id?: number | null;
}

interface Cluster {
    location: string;
    facilities: Facility[];
    proposedParent?: Facility;
    children?: Facility[];
}

async function identifyHierarchy() {
    console.log("🔍 Scanning for Parent-Child Hierarchy Candidates...\n");

    // Fetch all facilities
    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type, lat, lng, parent_id')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("❌ Failed to fetch facilities:", error);
            return;
        }
        if (!data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    // Group by Location (Lat, Lng)
    const coordMap = new Map<string, Facility[]>();
    allFacilities.forEach(f => {
        if (!f.lat || !f.lng) return;
        const key = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}`;
        if (!coordMap.has(key)) coordMap.set(key, []);
        coordMap.get(key)?.push(f);
    });

    const hierarchyCandidates: Cluster[] = [];

    for (const [key, list] of coordMap.entries()) {
        if (list.length < 2) continue;

        // Check for Mixed Types (e.g., Park + Charnel + Funeral)
        const types = new Set(list.map(f => f.type));

        // Strategy: Identifying a "Parent"
        // Priority: 'park' > 'funeral' (if large) > others
        // Or Name Containment: "Busan Memorial Park" vs "Busan Memorial Park Crematorium"

        // We look for logic where one facility seems to 'contain' the others.
        // 1. One facility has 'park' type and others are 'charnel' or 'natural'?
        // 2. Name length? Often parent has shorter name? (e.g. "ABC Park" vs "ABC Park Funeral Home")

        let parent: Facility | undefined;

        // Score candidates for Parent
        const scored = list.map(f => {
            let score = 0;
            if (f.type === 'park') score += 10;
            if (f.type === 'funeral') score += 5;
            // Prefer shorter names?
            score -= f.name.length * 0.1;
            return { f, score };
        });

        scored.sort((a, b) => b.score - a.score);

        // Heuristic: If top scorer is significantly 'better' type or name is shorter and contained in others
        const candidateParent = scored[0].f;
        const others = list.filter(item => item !== candidateParent);

        // Verify Name Containment or meaningful relationship
        // If "Busan Park" contains "Busan Park", it's good.
        // If "ABC Funeral" and "XYZ Charnel" (totally different), maybe not hierarchy but neighbors.

        const validChildren: Facility[] = [];

        for (const child of others) {
            const pName = candidateParent.name.replace(/\s+/g, '');
            const cName = child.name.replace(/\s+/g, '');

            // If parent name is part of child name? 
            // Or if types are clearly Parent-Child relationship (Park -> Charnel) 
            // AND address is identical.

            const isTypeHierarchy = (candidateParent.type === 'park' && ['charnel', 'natural', 'funeral'].includes(child.type));
            const isNameHierarchy = cName.includes(pName);

            if (isTypeHierarchy || isNameHierarchy) {
                validChildren.push(child);
            }
        }

        if (validChildren.length > 0) {
            hierarchyCandidates.push({
                location: key,
                facilities: list,
                proposedParent: candidateParent,
                children: validChildren
            });
        }
    }

    // Generate Report
    let report = "# 🏛️ Hierarchy Candidates Report\n\n";
    report += `Generated at: ${new Date().toLocaleString()}\n`;
    report += `Found ${hierarchyCandidates.length} candidate groups.\n\n`;

    hierarchyCandidates.forEach((cluster, idx) => {
        const p = cluster.proposedParent!;
        report += `### Group ${idx + 1} (Loc: ${cluster.location})\n`;
        report += `**👑 Parent Candidate**: [${p.type}] **${p.name}** (ID: ${p.id})\n`;
        report += `**Children**:\n`;
        cluster.children?.forEach(c => {
            report += `  - ↳ [${c.type}] **${c.name}** (ID: ${c.id})\n`;
        });

        const ignored = cluster.facilities.filter(f => f !== p && !cluster.children?.includes(f));
        if (ignored.length > 0) {
            report += `**Ignored (No Hierarchy Detected)**:\n`;
            ignored.forEach(f => {
                report += `  - [${f.type}] **${f.name}** (ID: ${f.id})\n`;
            });
        }
        report += `\n---\n`;
    });

    fs.writeFileSync('hierarchy_report.md', report, 'utf8');
    console.log(`✅ Hierarchy report generated: hierarchy_report.md`);
    console.log(`Found ${hierarchyCandidates.length} candidates.`);
}

identifyHierarchy();
