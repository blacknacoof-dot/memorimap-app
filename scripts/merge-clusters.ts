
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
    is_verified: boolean;
    data_source: string;
    review_count: number;
    image_url: string;
    phone: string;
}

const DRY_RUN = process.argv.includes('--dry-run');

// Source Priority: Higher score wins
function getSourceScore(source: string): number {
    if (!source) return 0;
    if (source.includes('verified')) return 100; // Manual/Admin verified
    if (source.includes('esky')) return 80;      // E-Sky (Gov)
    if (source.includes('kakao') || source.includes('naver')) return 50; // Map APIs
    if (source.includes('ai') || source.includes('crawling')) return 10; // AI/Crawl
    return 20; // Unknown
}

async function mergeClusters() {
    console.log(`🔒 Starting Priority Merge (${DRY_RUN ? 'DRY RUN' : 'EXECUTION'})...\n`);

    // Fetch All
    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('*')
        .order('id');

    if (error || !facilities) {
        console.error("Failed to fetch:", error);
        return;
    }

    // Group by Lat,Lng (6 decimal) AND Type
    // We only merge if Type matches exactly.
    const clusterMap = new Map<string, Facility[]>();

    facilities.forEach(f => {
        if (!f.lat || !f.lng) return;
        const key = `${Number(f.lat).toFixed(6)},${Number(f.lng).toFixed(6)}|${f.type}`;
        if (!clusterMap.has(key)) clusterMap.set(key, []);
        clusterMap.get(key)?.push(f);
    });

    let mergeCount = 0;

    for (const [key, list] of clusterMap.entries()) {
        if (list.length < 2) continue;

        // Sort by Priority
        list.sort((a, b) => {
            // 1. Verified wins
            if (a.is_verified !== b.is_verified) return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);

            // 2. Source Priority
            const sA = getSourceScore(a.data_source);
            const sB = getSourceScore(b.data_source);
            if (sA !== sB) return sB - sA;

            // 3. Review Count
            if ((b.review_count || 0) !== (a.review_count || 0)) return (b.review_count || 0) - (a.review_count || 0);

            // 4. Image Presence
            if (!!b.image_url !== !!a.image_url) return (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0);

            return 0;
        });

        const winner = list[0];
        const losers = list.slice(1);

        console.log(`⚔️  Cluster [${winner.type}] at ${winner.address}`);
        console.log(`   👑 Winner: ${winner.name} (ID: ${winner.id}, Src: ${winner.data_source}, Ver: ${winner.is_verified})`);

        for (const loser of losers) {
            console.log(`   🗑️  Loser:  ${loser.name} (ID: ${loser.id}, Src: ${loser.data_source})`);

            if (!DRY_RUN) {
                // 1. Merge Data (Phone, Image if missing)
                const updates: any = {};
                if (!winner.phone && loser.phone) updates.phone = loser.phone;
                if (!winner.image_url && loser.image_url) updates.image_url = loser.image_url;

                // Add reviews to count? (Optional, maybe complicate)

                if (Object.keys(updates).length > 0) {
                    await supabase.from('memorial_spaces').update(updates).eq('id', winner.id);
                    Object.assign(winner, updates); // Update local object
                }

                // 2. Move Relations (Reviews, Images)
                await supabase.from('facility_reviews').update({ facility_id: winner.id }).eq('facility_id', loser.id);
                await supabase.from('facility_images').update({ facility_id: winner.id }).eq('facility_id', loser.id);

                // 3. Delete Loser
                const { error: delError } = await supabase.from('memorial_spaces').delete().eq('id', loser.id);
                if (delError) console.error(`      ❌ Delete failed: ${delError.message}`);
                else {
                    console.log(`      ✅ Merged & Deleted.`);
                    mergeCount++;
                }
            }
        }
        console.log('-----------------------------------');
    }

    if (DRY_RUN) {
        console.log(`\n🔎 [DRY RUN] Would merge ${mergeCount} facilities (actually calculated simply as identified losers).`);
    } else {
        console.log(`\n✅ Merged ${mergeCount} facilities.`);
    }
}

mergeClusters();
