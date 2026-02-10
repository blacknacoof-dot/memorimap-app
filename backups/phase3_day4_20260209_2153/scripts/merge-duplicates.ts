
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function mergeDuplicates() {
    console.log("🔄 중복 시설 병합 작업 시작...\n");

    const { data: facilities, error } = await supabase
        .from('memorial_spaces')
        .select('id, name, address, type, is_verified, data_source, review_count, image_url, phone')
        .not('address', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    const addrMap = new Map<string, any[]>();

    // Group by Address (normalized)
    facilities?.forEach(f => {
        if (!f.address) return;
        const key = f.address.replace(/\s+/g, '').trim();
        if (!addrMap.has(key)) {
            addrMap.set(key, []);
        }
        addrMap.get(key)?.push(f);
    });

    let mergeCount = 0;

    for (const [key, list] of addrMap.entries()) {
        if (list.length > 1) {
            // Filter only if names are similar (first 2 chars match OR one includes another)
            // To avoid merging different businesses at same address.
            const baseName = list[0].name.replace(/\s+/g, '');

            // Sub-group by Name Similarity
            // Simple approach: look for exact name match (ignoring spaces) or very close.
            // For this user request, "Same Address" implies we trust address overlap significantly?
            // User said "같은 주소에 2개... 한개로 합쳐줘".
            // I'll be aggressive but check name similarity.

            // Only merge if names share at least 2 characters?
            // Or if one contains the other.

            const groupToMerge = list.filter(f => {
                const n1 = f.name.replace(/\s+/g, '');
                const n2 = list[0].name.replace(/\s+/g, '');
                return n1.includes(n2) || n2.includes(n1) || (n1.slice(0, 2) === n2.slice(0, 2));
            });

            if (groupToMerge.length < 2) continue;

            // Sort to find Winner
            // Priority: Has Reviews > Verified > Has Image > Newer
            groupToMerge.sort((a, b) => {
                if ((b.review_count || 0) !== (a.review_count || 0)) return (b.review_count || 0) - (a.review_count || 0);
                if (b.is_verified !== a.is_verified) return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
                if (!!b.image_url !== !!a.image_url) return (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0);
                return 0;
            });

            const winner = groupToMerge[0];
            const losers = groupToMerge.slice(1);

            console.log(`⚔️  병합 대상 (주소: ${winner.address})`);
            console.log(`   👑 Winner: [${winner.type}] ${winner.name} (Rev: ${winner.review_count}, Ver: ${winner.is_verified})`);

            for (const loser of losers) {
                console.log(`   🗑️  Loser:  [${loser.type}] ${loser.name} (Rev: ${loser.review_count}, Ver: ${loser.is_verified})`);

                // Merge Data Logic (If Winner missing info, take from Loser)
                const updates: any = {};
                if (!winner.phone && loser.phone) updates.phone = loser.phone;
                if (!winner.image_url && loser.image_url) updates.image_url = loser.image_url;
                // Don't merge name/address as winner is preferred.

                if (Object.keys(updates).length > 0) {
                    await supabase.from('memorial_spaces').update(updates).eq('id', winner.id);
                    // Apply generic update to object
                    Object.assign(winner, updates);
                }

                // Delete Loser
                const { error: delError } = await supabase.from('memorial_spaces').delete().eq('id', loser.id);
                if (delError) {
                    console.error(`   ❌ 삭제 실패: ${delError.message}`);
                } else {
                    console.log(`   ✅ 삭제 완료`);
                    mergeCount++;
                }
            }
            console.log('-----------------------------------');
        }
    }

    console.log(`\n✅ 총 ${mergeCount}개의 중복 시설이 병합(삭제)되었습니다.`);
}

mergeDuplicates();
