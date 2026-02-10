
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

const DRY_RUN = process.argv.includes('--dry-run');

// Haversine Distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

function getSourceScore(source: string): number {
    if (!source) return 0;
    if (source.includes('verified')) return 100;
    if (source.includes('esky')) return 80;
    if (source.includes('kakao') || source.includes('naver')) return 50;
    if (source.includes('ai') || source.includes('crawling')) return 10;
    return 20;
}

function normalizeName(name: string): string {
    return name.replace(/\s+/g, '').trim();
}

async function mergeSameNameStart() {
    console.log(`⚔️  Merging Same Name (Nearby) Duplicates (${DRY_RUN ? 'DRY RUN' : 'LIVE'})...\n`);

    // Fetch All with Pagination
    let facilities: Facility[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('memorial_spaces')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error || !data || data.length === 0) break;
        facilities = facilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    console.log(`Fetched ${facilities.length} facilities.`);


    // Group by Name
    const nameMap = new Map<string, Facility[]>();
    facilities.forEach(f => {
        const key = normalizeName(f.name);
        if (f.name.includes('대전추모공원')) {
            console.log(`[DEBUG] Mapping ${f.name} -> Key: '${key}'`);
        }
        if (!nameMap.has(key)) nameMap.set(key, []);
        nameMap.get(key)?.push(f);
    });

    let mergeCount = 0;

    for (const [name, list] of nameMap.entries()) {
        if (list.length < 2) continue;

        // Try to cluster them by distance
        // Simple approach: Take first item, find all within X km. 
        // Then recursively handle remaining?
        // Or just pair-wise check?
        // Better: Cluster algorithm.

        const clusters: Facility[][] = [];
        const visited = new Set<number>();

        for (let i = 0; i < list.length; i++) {
            if (visited.has(list[i].id)) continue;

            const cluster = [list[i]];
            visited.add(list[i].id);

            for (let j = i + 1; j < list.length; j++) {
                if (visited.has(list[j].id)) continue;

                // Distance Check: 5km (Reasonable for same facility with bad coordinates)
                // "Daejeon Memorial Park" at 36.2837 vs 36.2841 is 40m.
                const dist = getDistanceFromLatLonInKm(list[i].lat, list[i].lng, list[j].lat, list[j].lng);

                console.log(`[DEBUG] Comparing ${list[i].name} vs ${list[j].name}: Dist ${dist.toFixed(4)} km`);

                if (dist < 5.0) { // 5km
                    cluster.push(list[j]);
                    visited.add(list[j].id);
                }
            }
            if (cluster.length > 1) {
                console.log(`[DEBUG] Found cluster: ${cluster.map(c => c.name).join(', ')}`);
                clusters.push(cluster);
            }
        }

        // Process Clusters
        for (const group of clusters) {
            // Sort by Priority
            group.sort((a, b) => {
                if (a.is_verified !== b.is_verified) return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
                const sA = getSourceScore(a.data_source);
                const sB = getSourceScore(b.data_source);
                if (sA !== sB) return sB - sA;
                return (b.review_count || 0) - (a.review_count || 0);
            });

            const winner = group[0];
            const losers = group.slice(1);

            console.log(`🔹 Merging Name Cluster "${name}" (Size: ${group.length})`);
            console.log(`   👑 Winner: ${winner.name} (ID: ${winner.id}, Src: ${winner.data_source})`);

            for (const loser of losers) {
                // Safety: Don't merge distinct Types if possible?
                // But user specifically complained about "Same Name".
                // If types are different but Name/Loc match, it's likely a duplicate or user error in data.
                // "Daejeon Memorial Park (Park)" vs "Daejeon Memorial Park (Charnel)" -> Valid hierarchy?
                // But wait, the previous "Hierarchy" scan already handled hierarchy.
                // If hierarchy scan didn't catch it, maybe they aren't marked as Park/Charnel correctly?
                // Or maybe User just wants them merged into one entry.

                // If user says "Same Name Merge", let's merge.

                console.log(`   🗑️  Loser: ${loser.name} (ID: ${loser.id}, Src: ${loser.data_source})`);

                if (!DRY_RUN) {
                    // 1. Data Merge
                    const updates: any = {};
                    if (!winner.phone && loser.phone) updates.phone = loser.phone;
                    if (!winner.image_url && loser.image_url) updates.image_url = loser.image_url;

                    if (Object.keys(updates).length > 0) {
                        await supabase.from('memorial_spaces').update(updates).eq('id', winner.id);
                    }

                    // 2. Relations
                    await supabase.from('facility_reviews').update({ facility_id: winner.id }).eq('facility_id', loser.id);
                    await supabase.from('facility_images').update({ facility_id: winner.id }).eq('facility_id', loser.id);

                    // 3. Parent/Child Logic
                    if (winner.parent_id === loser.id) {
                        await supabase.from('memorial_spaces').update({ parent_id: null }).eq('id', winner.id);
                    }
                    await supabase.from('memorial_spaces').update({ parent_id: winner.id }).eq('parent_id', loser.id);

                    // 4. Delete
                    const { error: delError } = await supabase.from('memorial_spaces').delete().eq('id', loser.id);
                    if (delError) {
                        console.error(`      ❌ Delete failed: ${delError.message}`);
                    } else {
                        console.log(`      ✅ Merged.`);
                        mergeCount++;
                    }
                } else {
                    console.log(`      ✅ [DRY] Would Merge.`);
                    mergeCount++;
                }
            }
        }
    }

    console.log(`\n✅ Merged ${mergeCount} facilities.`);
}

mergeSameNameStart();
