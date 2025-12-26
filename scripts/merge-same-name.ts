
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

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
    review_count: number;
    image_url: string;
    phone: string;
}

// Source Priority
function getSourceScore(source: string): number {
    if (!source) return 0;
    if (source.includes('verified')) return 100;
    if (source.includes('esky')) return 80;
    if (source.includes('kakao') || source.includes('naver')) return 50;
    if (source.includes('ai') || source.includes('crawling')) return 10;
    return 20;
}

async function mergeSameName() {
    console.log("⚔️  Merging Same Name & Location Duplicates...\n");

    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
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

    let mergeCount = 0;

    for (const [key, list] of coordMap.entries()) {
        if (list.length < 2) continue;

        const nameMap = new Map<string, Facility[]>();
        list.forEach(f => {
            const normName = f.name.replace(/\s+/g, '').trim();
            if (!nameMap.has(normName)) nameMap.set(normName, []);
            nameMap.get(normName)?.push(f);
        });

        for (const [nKey, group] of nameMap.entries()) {
            if (group.length < 2) continue;

            // Sort by Priority
            group.sort((a, b) => {
                if (a.is_verified !== b.is_verified) return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
                const sA = getSourceScore(a.data_source);
                const sB = getSourceScore(b.data_source);
                if (sA !== sB) return sB - sA;
                if ((b.review_count || 0) !== (a.review_count || 0)) return (b.review_count || 0) - (a.review_count || 0);
                if (!!b.image_url !== !!a.image_url) return (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0);
                return 0;
            });

            const winner = group[0];
            const losers = group.slice(1);

            console.log(`🔹 Merging "${winner.name}" at ${key}`);
            console.log(`   👑 Winner: ID ${winner.id} (Ver: ${winner.is_verified})`);

            for (const loser of losers) {
                console.log(`   🗑️  Loser: ID ${loser.id}`);

                // 1. Data Merge (Phone, Image)
                const updates: any = {};
                if (!winner.phone && loser.phone) updates.phone = loser.phone;
                if (!winner.image_url && loser.image_url) updates.image_url = loser.image_url;

                if (Object.keys(updates).length > 0) {
                    await supabase.from('memorial_spaces').update(updates).eq('id', winner.id);
                }

                // 2. Hierarchy Check
                // If Winner was child of Loser? -> Set Winner parent to NULL
                if (winner.parent_id === loser.id) {
                    await supabase.from('memorial_spaces').update({ parent_id: null }).eq('id', winner.id);
                }

                // If Loser is parent of others? -> Move children to Winner
                // (Unless child IS winner, which we handled above)
                await supabase.from('memorial_spaces').update({ parent_id: winner.id }).eq('parent_id', loser.id);

                // 3. Move Relations
                await supabase.from('facility_reviews').update({ facility_id: winner.id }).eq('facility_id', loser.id);
                await supabase.from('facility_images').update({ facility_id: winner.id }).eq('facility_id', loser.id);

                // 4. Delete Loser
                const { error: delError } = await supabase.from('memorial_spaces').delete().eq('id', loser.id);
                if (delError) {
                    console.error(`      ❌ Delete failed: ${delError.message}`);
                } else {
                    console.log(`      ✅ Merged.`);
                    mergeCount++;
                }
            }
        }
    }

    console.log(`\n✅ Merged ${mergeCount} same-name facilities.`);
}

mergeSameName();
