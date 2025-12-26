
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

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
}

async function executeHierarchy() {
    console.log("🏗️ Executing Hierarchy Update (Parent-Child Linking)...\n");

    // Re-run identification logic to be fresh (reuse logic from identify-hierarchy.ts)
    // Fetch all facilities
    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('id, name, address, type, lat, lng')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) { console.error(error); return; }
        if (!data || data.length === 0) break;
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

    let linkCount = 0;

    for (const [key, list] of coordMap.entries()) {
        if (list.length < 2) continue;

        // Parent Selection Logic (Same as Report)
        const scored = list.map(f => {
            let score = 0;
            if (f.type === 'park') score += 10;
            if (f.type === 'funeral') score += 5;
            score -= f.name.length * 0.1;
            return { f, score };
        });
        scored.sort((a, b) => b.score - a.score);

        const parent = scored[0].f;
        const potentialChildren = list.filter(item => item !== parent);

        for (const child of potentialChildren) {
            const pName = parent.name.replace(/\s+/g, '');
            const cName = child.name.replace(/\s+/g, '');

            const isTypeHierarchy = (parent.type === 'park' && ['charnel', 'natural', 'funeral'].includes(child.type));
            const isNameHierarchy = cName.includes(pName);

            if (isTypeHierarchy || isNameHierarchy) {
                // UPDATE Child
                console.log(`🔗 Linking [${child.id}] ${child.name} -> Parent [${parent.id}] ${parent.name}`);
                const { error } = await supabase
                    .from('memorial_spaces')
                    .update({ parent_id: parent.id })
                    .eq('id', child.id);

                if (error) console.error(`   ❌ Failed: ${error.message}`);
                else linkCount++;
            }
        }
    }

    console.log(`\n✅ Hierarchy Update Complete: ${linkCount} links established.`);
}

executeHierarchy();
