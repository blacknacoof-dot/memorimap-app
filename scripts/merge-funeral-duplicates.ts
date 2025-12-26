
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

function getSourceScore(source: string): number {
    if (!source) return 0;
    if (source.includes('verified')) return 100;
    if (source.includes('esky')) return 80;
    if (source.includes('kakao') || source.includes('naver')) return 50;
    if (source.includes('ai') || source.includes('crawling')) return 10;
    return 20;
}

// Normalize address for grouping: "전라남도 영암군..." -> "전라남도영암군"
function normalizeAddress(addr: string): string {
    if (!addr) return "";
    return addr.replace(/\s+/g, '').substring(0, 15); // First 15 chars normalized
}

async function mergeFuneralDuplicates() {
    console.log("⚔️  Merging Funeral Homes (Same Name & Similar Address)...\n");

    // Fetch records that might be funeral homes (type 'funeral' OR name contains '장례식장')
    let allFacilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            //.or('type.eq.funeral,name.ilike.%장례식장%') // .or requires format
            // Simplified: fetch all and filter locally for flexibility, or query better.
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !data || data.length === 0) break;

        // Filter locally
        const filtered = data.filter((f: Facility) => f.type === 'funeral' || f.name.includes('장례식장'));

        allFacilities = allFacilities.concat(filtered);
        if (data.length < pageSize) break; // Finished? 
        // Note: if filtered length is small but data.length was full, we must continue.
        // The break condition `data.length < pageSize` is correct for pagination end.
        page++;
    }

    // Group by Name first
    const nameMap = new Map<string, Facility[]>();
    allFacilities.forEach(f => {
        const normName = f.name.replace(/\s+/g, '').trim();
        if (!nameMap.has(normName)) nameMap.set(normName, []);
        nameMap.get(normName)?.push(f);
    });

    let mergeCount = 0;

    for (const [name, list] of nameMap.entries()) {
        if (list.length < 2) continue;

        // Sub-group by Address
        const addrMap = new Map<string, Facility[]>();
        list.forEach(f => {
            const key = normalizeAddress(f.address);
            if (!key) {
                // No address? Put in a separate bucket or 'unknown'
                // merging unknowns is risky.
                return;
            }
            if (!addrMap.has(key)) addrMap.set(key, []);
            addrMap.get(key)?.push(f);
        });

        for (const [addrKey, group] of addrMap.entries()) {
            if (group.length < 2) continue;

            // Sort Priority
            group.sort((a, b) => {
                if (a.is_verified !== b.is_verified) return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
                const sA = getSourceScore(a.data_source);
                const sB = getSourceScore(b.data_source);
                if (sA !== sB) return sB - sA;
                if ((b.review_count || 0) !== (a.review_count || 0)) return (b.review_count || 0) - (a.review_count || 0);
                return 0;
            });

            const winner = group[0];
            const losers = group.slice(1);

            console.log(`🔹 Merging "${winner.name}" (Address: ${winner.address?.substring(0, 20)}...)`);
            console.log(`   👑 Winner: ID ${winner.id} (Src: ${winner.data_source})`);

            for (const loser of losers) {
                console.log(`   🗑️  Loser: ID ${loser.id} (Src: ${loser.data_source})`);

                // Update Winner Data if missing
                const updates: any = {};
                if (!winner.phone && loser.phone) updates.phone = loser.phone;
                if (!winner.image_url && loser.image_url) updates.image_url = loser.image_url;
                if (!winner.lat || !winner.lng || (winner.lat === 0 && winner.lng === 0)) {
                    if (loser.lat && loser.lng) {
                        updates.lat = loser.lat;
                        updates.lng = loser.lng;
                    }
                }

                if (Object.keys(updates).length > 0) {
                    await supabase.from('memorial_spaces').update(updates).eq('id', winner.id);
                    Object.assign(winner, updates);
                }

                // Relink
                if (winner.parent_id === loser.id) await supabase.from('memorial_spaces').update({ parent_id: null }).eq('id', winner.id);
                await supabase.from('memorial_spaces').update({ parent_id: winner.id }).eq('parent_id', loser.id);
                await supabase.from('facility_reviews').update({ facility_id: winner.id }).eq('facility_id', loser.id);
                await supabase.from('facility_images').update({ facility_id: winner.id }).eq('facility_id', loser.id);

                // Delete
                const { error } = await supabase.from('memorial_spaces').delete().eq('id', loser.id);
                if (error) console.error(`      ❌ Delete failed: ${error.message}`);
                else {
                    console.log(`      ✅ Merged.`);
                    mergeCount++;
                }
            }
        }
    }

    console.log(`\n✅ Merged ${mergeCount} funeral home facilities.`);
}

mergeFuneralDuplicates();
